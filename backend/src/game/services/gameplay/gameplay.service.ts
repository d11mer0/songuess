import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game/game.service';
import { RoomHelperService } from '../room/room-helper.service';
import { RoomManagerService } from '../room/room-manager.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { SelectedTracks, TrackItem } from '../../interfaces/tracks.interface';
import { createInitialPlayerResults, validateAnswerSubmission, createPlayerRoundResult} from '../../../utils/gameplay/player-results.utils';
import {checkAllPlayersAnswered } from '../../../utils/gameplay/round.util';
import { filterTracks } from '../../../utils/track-utils';
import { isFuzzyMatch } from '../../../utils/gameplay/fuzzy-match.util';
import { RoundManagerService } from './round-manager.service';
import { GameEventsService } from './game-events.service';
import { GameResultService } from './game-result.service';

@Injectable()
export class GameplayService {
    private server: Server | null = null;
    private reactionCooldowns = new Map<number, number>();
    private readonly allowedReactions = new Set(['🔥', '💀', '😭', '🎉', '🤔', '👏']);

    constructor(
        private readonly roomHelperService: RoomHelperService,
        private readonly roundManager: RoundManagerService,
        private readonly gameEvents: GameEventsService,
        private readonly gameResult: GameResultService,
        @Inject(forwardRef(() => RoomManagerService))
        private readonly roomManager: RoomManagerService,
    ) {}

    setServer(server: Server) {
        this.server = server;
        this.roundManager.setServer(server);
        this.gameEvents.setServer(server);
        this.gameResult.setServer(server);
    }

    handleLaunchGame(client: Socket, roomId: string, selectedTracks: SelectedTracks) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room) return;

        const userId = client.data.user?.id;
        if (room.leaderId !== userId) return;
        if (room.state === GameRoomState.STARTED) return;
        
        const playableTracks = filterTracks(selectedTracks?.tracks || []);
        if (playableTracks.length < 4) return;

        this.roundManager.cancelRoomGame(room.id);

        room.gameData = {
            ...selectedTracks,
            tracks: playableTracks,
        };
        room.state = GameRoomState.STARTED;

        const rawRounds = room.lobbyOptions?.roundsCount || (room.lobbyOptions?.gameMode === 'DUEL' ? 5 : 10);
        const roundsCount = Math.min(20, Math.max(1, Number(rawRounds) || 10));
        const rounds = this.roundManager.generateGameRounds(playableTracks, roundsCount);
        const playerResults = createInitialPlayerResults(room.players);

        const totalScores: Record<number, number> = room.players.reduce(
            (acc, player) => {
                acc[player.id] = 0;
                return acc;
            },
            {} as Record<number, number>,
        );

        room.gameProgress = {
            currentRound: 0,
            rounds,
            playerResults,
            totalScores,
            streaks: {},
        };

        this.roomManager.syncRoom(room);
        this.roundManager.startRound(room.id, 0, rounds[0]);
    }

    handleAnswer(client: Socket, roomId: string, roundNumber: number, answer: string, snippetDurationUsed?: number) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room?.gameProgress) return;
        if (room.state !== GameRoomState.STARTED) return;

        const playerId = client.data.user?.id;
        if (!playerId) return;

        const { rounds, playerResults } = room.gameProgress;

        if (typeof roundNumber !== 'number' || roundNumber !== room.gameProgress.currentRound) return;
        if (!rounds[roundNumber]) return;

        if (!playerResults[playerId]) {
            playerResults[playerId] = {};
        }

        if (!validateAnswerSubmission(playerResults, playerId, roundNumber)) return;

        const round = rounds[roundNumber];
        const answerMode = room.lobbyOptions?.answerMode || 'MULTIPLE_CHOICE';
        const gameMode = room.lobbyOptions?.gameMode || 'CLASSIC';

        // Якщо гравець у режимі TYPE_IN ввів правильного артиста замість назви треку — не спалюємо спробу, а даємо підказку!
        if (answerMode === 'TYPE_IN' && answer?.trim()) {
            const preMatch = isFuzzyMatch(answer, round.track.title, round.track.artistName);
            if (!preMatch.isMatch && preMatch.isArtistMatch) {
                client.emit('artistMatchHint', {
                    roundNumber,
                    artistName: round.track.artistName || '',
                });
                return;
            }
        }

        const recordedSnippet = room.gameProgress.heardleUnlockedTiers?.[playerId]?.[roundNumber] || 1;
        const effectiveSnippetDuration = gameMode === 'HEARDLE'
            ? Math.max(recordedSnippet, snippetDurationUsed || 1)
            : snippetDurationUsed;

        playerResults[playerId][roundNumber] = createPlayerRoundResult(
            round,
            answer,
            answerMode,
            effectiveSnippetDuration,
        );

        this.roomManager.syncRoom(room);
        this.server?.to(roomId).emit('playerAnswered', { playerId, roundNumber });

        // У режимі DUEL, якщо гравець дав правильну відповідь — раунд фінішує негайно!
        const result = playerResults[playerId][roundNumber];
        if (gameMode === 'DUEL' && result.isCorrect) {
            this.roundManager.finishRound(roomId, roundNumber);
            return;
        }

        const onlineCount = room.players.filter((p) => p.isOnline).length;
        const targetCount = Math.max(1, onlineCount);
        const allAnswered = checkAllPlayersAnswered(playerResults, roundNumber, targetCount);
        if (allAnswered) {
            this.roundManager.finishRound(room.id, roundNumber);
        }
    }

    handleUnlockHeardleSnippet(
        client: Socket,
        roomId: string,
        roundNumber: number,
        snippetDuration: number,
    ) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room?.gameProgress || room.state !== GameRoomState.STARTED) return;

        const playerId = client.data.user?.id;
        if (!playerId || typeof roundNumber !== 'number' || typeof snippetDuration !== 'number') return;

        if (!room.gameProgress.heardleUnlockedTiers) {
            room.gameProgress.heardleUnlockedTiers = {};
        }
        if (!room.gameProgress.heardleUnlockedTiers[playerId]) {
            room.gameProgress.heardleUnlockedTiers[playerId] = {};
        }
        const currentMax = room.gameProgress.heardleUnlockedTiers[playerId][roundNumber] || 1;
        room.gameProgress.heardleUnlockedTiers[playerId][roundNumber] = Math.max(currentMax, snippetDuration);
    }


    handleReaction(client: Socket, roomId: string, emoji: string) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room) return;

        const playerId = client.data.user?.id;
        if (!playerId) return;

        const inRoom = room.players.some((p) => p.id === playerId);
        if (!inRoom) return;

        if (!emoji || !this.allowedReactions.has(emoji)) return;

        const now = Date.now();
        const lastAt = this.reactionCooldowns.get(playerId) || 0;
        if (now - lastAt < 400) return;
        this.reactionCooldowns.set(playerId, now);

        this.server?.to(roomId).emit('playerReaction', {
            playerId,
            emoji,
            timestamp: now,
        });
    }

    handleRestartGame(client: Socket, roomId: string) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room) return;

        const userId = client.data.user?.id;
        if (room.leaderId !== userId) return;

        this.roundManager.cancelRoomGame(room.id);

        room.state = room.lobbyOptions?.isPartyMode ? GameRoomState.ADDING : GameRoomState.CREATING;
        room.gameData = undefined;
        room.gameProgress = undefined;

        room.players = room.players.map(player => ({ ...player, totalScore: 0 }));
        
        this.roomHelperService.cancelRoomCleanup(room.id);
        this.roomManager.syncRoom(room);
        this.roomManager.broadcastRoomsList();
        this.server?.to(room.id).emit('gameRestarted', room);
    }
}
