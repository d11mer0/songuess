import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomManagerService } from './room-manager.service';
import { RoomQueryService } from './room-query.service';
import { GameplayService } from '../gameplay/gameplay.service';
import { DeezerService } from '../../../deezer/deezer.service';
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

    constructor(
        private readonly roomManager: RoomManagerService,
        private readonly roomQuery: RoomQueryService,
        @Inject(forwardRef(() => GameplayService))
        private readonly gameplayService: GameplayService,
        private readonly deezerService: DeezerService,
    ) {}

    setServer(server: Server) {
        this.server = server;
    }

    addToDuelQueue(socket: Socket, user: { id: number; login: string }) {
        // Якщо гравець уже в черзі, оновлюємо сокет
        this.removeFromDuelQueue(user.id);

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
        this.duelQueue = this.duelQueue.filter((p) => p.userId !== userId);
    }

    removeBySocket(socketId: string) {
        this.duelQueue = this.duelQueue.filter((p) => p.socket.id !== socketId);
    }

    private async checkAndStartMatch() {
        if (this.duelQueue.length < 2) return;

        // Беремо перших двох гравців з черги
        const player1 = this.duelQueue.shift()!;
        const player2 = this.duelQueue.shift()!;

        // Перевіряємо чи вони все ще підключені
        if (player1.socket.disconnected) {
            this.duelQueue.unshift(player2);
            return;
        }
        if (player2.socket.disconnected) {
            this.duelQueue.unshift(player1);
            return;
        }

        try {
            // Створюємо кімнату для дуелі 1v1
            const roomId = await this.roomManager.createRoom(
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

            // Підключаємо обох до кімнати на рівні Socket.IO
            player1.socket.join(roomId);
            player2.socket.join(roomId);

            // Другий гравець приєднується до кімнати
            const room = await this.roomManager.joinRoom(
                roomId,
                player2.userId,
                player2.login,
            );

            if (!room) {
                player1.socket.emit('duelError', 'Failed to create match room');
                player2.socket.emit('duelError', 'Failed to create match room');
                return;
            }

            // Отримуємо треки з популярного світового чарту для дуелі (Deezer Top Worldwide 3155776842)
            let tracks: TrackItem[] = [];
            try {
                const playlistData = await this.deezerService.getPlaylistById(3155776842);
                if (playlistData?.tracks?.data && playlistData.tracks.data.length >= 5) {
                    tracks = playlistData.tracks.data;
                }
            } catch (err) {
                console.warn('Не вдалося отримати чарт Deezer, шукаємо топ-треки:', err.message);
            }

            // Якщо не вдалося отримати чарт, шукаємо "top hits"
            if (tracks.length < 5) {
                const searchRes = await this.deezerService.search('top hits', 'track');
                if (searchRes?.data) {
                    tracks = searchRes.data.filter((t: any) => t.preview);
                }
            }

            const selectedTracks: SelectedTracks = {
                type: 'PLAYLIST',
                playlist: {
                    id: '3155776842',
                    title: '1v1 Blitz Duel Arena',
                },
                tracks,
            };

            const roomInfo = this.roomQuery.getRoomInfo(roomId, this.roomManager.allRooms);

            // Сповіщаємо обох гравців про знайденого суперника
            this.server?.to(roomId).emit('duelMatchFound', {
                roomId,
                room: roomInfo,
                opponent1: player1.login,
                opponent2: player2.login,
            });

            // Автоматичний старт гри через 2 секунди
            setTimeout(() => {
                this.gameplayService.handleLaunchGame(
                    player1.socket,
                    roomId,
                    selectedTracks,
                );
            }, 2000);
        } catch (error) {
            console.error('Помилка запуску дуелі:', error);
            player1.socket.emit('duelError', 'Matchmaking error');
            player2.socket.emit('duelError', 'Matchmaking error');
        }
    }
}