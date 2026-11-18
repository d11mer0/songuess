import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomManagerService } from './room-manager.service';
import { RoomQueryService } from './room-query.service';
import { RoomHelperService } from './room-helper.service';
import { GameplayService } from '../gameplay/gameplay.service';
import { DeezerService } from '../../../deezer/deezer.service';
import { GameRoomState } from '../../interfaces/game.interface';
import { SelectedTracks, TrackItem } from '../../interfaces/tracks.interface';

interface QueuedPlayer {
    userId: number;
    login: string;
    socket: Socket;
    joinedAt: number;
}

@Injectable()
export class MatchmakingService {
    private server: Server | null = null;
    private duelQueue: QueuedPlayer[] = [];
    private cancelledUsers = new Set<number>();
    private pendingDuelTimers = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly roomManager: RoomManagerService,
        private readonly roomQuery: RoomQueryService,
        @Inject(forwardRef(() => GameplayService))
        private readonly gameplayService: GameplayService,
        private readonly deezerService: DeezerService,
        @Optional()
        @Inject(forwardRef(() => RoomHelperService))
        private readonly roomHelperService?: RoomHelperService,
    ) {
        this.roomHelperService?.onRoomDisposed?.((roomId) => this.clearPendingDuelTimer(roomId));
    }

    setServer(server: Server) {
        this.server = server;
    }

    clearPendingDuelTimer(roomId: string) {
        const timer = this.pendingDuelTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.pendingDuelTimers.delete(roomId);
        }
    }

    addToDuelQueue(socket: Socket, user: { id: number; login: string }) {
        this.cancelledUsers.delete(user.id);
        this.duelQueue = this.duelQueue.filter((p) => p.userId !== user.id);

        this.duelQueue.push({
            userId: user.id,
            login: user.login,
            socket,
            joinedAt: Date.now(),
        });

        socket.emit('duelQueueStatus', {
            status: 'WAITING',
            queueSize: this.duelQueue.length,
        });

        this.checkAndStartMatch();
    }

    removeFromDuelQueue(userId: number) {
        this.cancelledUsers.add(userId);
        this.duelQueue = this.duelQueue.filter((p) => p.userId !== userId);
    }

    removeBySocket(socketId: string) {
        const target = this.duelQueue.find((p) => p.socket.id === socketId);
        if (target) {
            this.cancelledUsers.add(target.userId);
        }
        this.duelQueue = this.duelQueue.filter((p) => p.socket.id !== socketId);
    }

    private isPlayerAvailable(player: QueuedPlayer): boolean {
        return !this.cancelledUsers.has(player.userId) && !player.socket.disconnected;
    }

    private async checkAndStartMatch() {
        this.duelQueue = this.duelQueue.filter((p) => !p.socket.disconnected);
        if (this.duelQueue.length < 2) return;

        const player1 = this.duelQueue.shift()!;
        const player2 = this.duelQueue.shift()!;
        let roomId: string | null = null;

        try {
            roomId = await this.roomManager.createRoom(
                player1.userId,
                player1.login,
                {
                    allowAutoJoin: false,
                    publicLobby: false,
                    maxPlayers: 2,
                    gameMode: 'DUEL',
                    roundsCount: 5,
                    answerMode: 'MULTIPLE_CHOICE',
                },
            );

            // Якщо player1 відмінив пошук або вийшов під час створення кімнати
            if (!this.isPlayerAvailable(player1)) {
                this.roomManager.deleteRoomBySystem(roomId);
                if (this.isPlayerAvailable(player2)) {
                    player2.socket.emit('duelError', 'Opponent cancelled matchmaking');
                }
                return;
            }

            player1.socket.join(roomId);
            player2.socket.join(roomId);

            const room = await this.roomManager.joinRoom(
                roomId,
                player2.userId,
                player2.login,
            );

            if (!room) {
                this.roomManager.deleteRoomBySystem(roomId);
                player1.socket.emit('duelError', 'Failed to create match room');
                player2.socket.emit('duelError', 'Failed to create match room');
                return;
            }

            let tracks: TrackItem[] = [];
            try {
                const playlistData = await this.deezerService.getPlaylistById(3155776842);
                if (playlistData?.tracks?.data && playlistData.tracks.data.length >= 5) {
                    tracks = playlistData.tracks.data;
                }
            } catch (err) {
                console.warn('Не вдалося отримати чарт Deezer, шукаємо топ-треки:', (err as Error).message);
            }

            if (tracks.length < 5) {
                const searchRes = await this.deezerService.search('top hits', 'track');
                if (searchRes?.data) {
                    tracks = searchRes.data.filter((t: TrackItem) => Boolean(t.preview));
                }
            }

            const currentRoom = this.roomManager.allRooms.find((r) => r.id === roomId);
            const bothInRoom = Boolean(
                currentRoom &&
                currentRoom.players.some((p) => p.id === player1.userId && p.isOnline) &&
                currentRoom.players.some((p) => p.id === player2.userId && p.isOnline),
            );

            if (!this.isPlayerAvailable(player1) || !this.isPlayerAvailable(player2) || !bothInRoom) {
                this.roomManager.deleteRoomBySystem(roomId);
                if (this.isPlayerAvailable(player1)) {
                    player1.socket.emit('duelError', 'Opponent cancelled or disconnected before match start');
                }
                if (this.isPlayerAvailable(player2)) {
                    player2.socket.emit('duelError', 'Opponent cancelled or disconnected before match start');
                }
                return;
            }

            if (tracks.length < 4) {
                this.roomManager.deleteRoomBySystem(roomId);
                player1.socket.emit('duelError', 'Not enough playable tracks available right now');
                player2.socket.emit('duelError', 'Not enough playable tracks available right now');
                return;
            }

            const selectedTracks: SelectedTracks = {
                type: 'PLAYLIST',
                playlist: {
                    id: '3155776842',
                    title: '1v1 Blitz Duel Arena',
                },
                tracks,
            };

            const activeTarget = this.roomManager.allRooms.find((r) => r.id === roomId);
            if (!activeTarget) {
                return;
            }
            activeTarget.state = GameRoomState.STARTED;
            await this.roomManager.syncRoom(activeTarget);

            const roomInfo = this.roomQuery.getRoomInfo(roomId, this.roomManager.allRooms);

            this.server?.to(roomId).emit('duelMatchFound', {
                roomId,
                room: roomInfo,
                opponent1: player1.login,
                opponent2: player2.login,
            });

            const activeRoomId = roomId;
            const timer = setTimeout(() => {
                this.pendingDuelTimers.delete(activeRoomId);
                const targetRoom = this.roomManager.allRooms.find((r) => r.id === activeRoomId);
                const onlinePlayers = targetRoom?.players.filter((p) => p.isOnline) || [];
                if (
                    !targetRoom ||
                    onlinePlayers.length < 2 ||
                    !this.isPlayerAvailable(player1) ||
                    !this.isPlayerAvailable(player2)
                ) {
                    this.server?.to(activeRoomId).emit('duelError', 'Opponent disconnected before match start');
                    this.roomManager.deleteRoomBySystem(activeRoomId);
                    return;
                }

                const starterSocket = targetRoom.leaderId === player2.userId ? player2.socket : player1.socket;
                try {
                    const launched = this.gameplayService.handleLaunchGame(
                        starterSocket,
                        activeRoomId,
                        selectedTracks,
                        true,
                    );
                    if (launched === false) {
                        throw new Error('Duel launch failed');
                    }
                } catch (launchErr) {
                    console.error('Duel launch failed:', launchErr);
                    this.server?.to(activeRoomId).emit('duelError', 'Failed to launch duel match');
                    this.roomManager.deleteRoomBySystem(activeRoomId);
                }
            }, 2000);

            this.clearPendingDuelTimer(activeRoomId);
            this.pendingDuelTimers.set(activeRoomId, timer);
        } catch (error) {
            console.error('Помилка запуску дуелі:', error);
            if (roomId) {
                this.roomManager.deleteRoomBySystem(roomId);
            }
            player1.socket.emit('duelError', 'Matchmaking error');
            player2.socket.emit('duelError', 'Matchmaking error');
        }
    }
}
