import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game/game.service';
import { RoomHelperService } from '../room/room-helper.service';
import { RoomManagerService } from '../room/room-manager.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { GameRound } from '../../interfaces/game-progress.interface';
import { SelectedTracks, TrackItem } from '../../interfaces/tracks.interface';
import { createInitialPlayerResults, validateAnswerSubmission, createPlayerRoundResult} from '../../../utils/gameplay/player-results.utils';
import {checkAllPlayersAnswered } from '../../../utils/gameplay/round.util';
import { filterTracks } from '../../../utils/track-utils';
import { isFuzzyMatch } from '../../../utils/gameplay/fuzzy-match.util';
import { inferMinHeardleTierFromElapsed, VALID_HEARDLE_TIERS } from '../../../utils/gameplay/scoring.util';
import { RoundManagerService } from './round-manager.service';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';
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
    ) {
        this.roomHelperService?.onRoomDisposed?.((roomId) => this.roundManager.cancelRoomGame(roomId));
        this.roomHelperService?.onRosterChanged?.((room) => this.checkRoundCompletion(room));
    }

    checkRoundCompletion(room: GameRoom) {
        if (room.state !== GameRoomState.STARTED || !room.gameProgress) return;
        const { currentRound, rounds, playerResults } = room.gameProgress;
        const round = rounds[currentRound];
        if (!round || (round as { isFinished?: boolean }).isFinished) return;
        if (checkAllPlayersAnswered(playerResults, currentRound, room.players)) {
            this.roundManager.finishRound(room.id, currentRound);
        }
    }

    setServer(server: Server) {
        this.server = server;
        this.roundManager.setServer(server);
        this.gameEvents.setServer(server);
        this.gameResult.setServer(server);
    }

    handleLaunchGame(
        client: Socket,
        roomId: string,
        selectedTracks: SelectedTracks,
        isSystemLaunch: boolean = false,
    ): boolean {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room) {
            if (isSystemLaunch) {
                throw new Error(`Room ${roomId} not found for system launch`);
            }
            return false;
        }

        if (!isSystemLaunch) {
            const userId = client?.data?.user?.id;
            if (!userId || room.leaderId !== userId) return false;
            if (room.state === GameRoomState.STARTED) return false;
            if (!room.lobbyOptions?.isPartyMode && room.state !== GameRoomState.CREATING) return false;
            if (
                room.lobbyOptions?.isPartyMode &&
                room.state !== GameRoomState.ADDING &&
                room.state !== GameRoomState.CREATING
            ) {
                return false;
            }
        }

        const playableTracks = filterTracks(selectedTracks?.tracks || []);
        if (playableTracks.length < 4) {
            const message = 'Not enough playable tracks to start the game (minimum 4 required)';
            if (isSystemLaunch) {
                throw new Error(message);
            }
            client?.emit('gameError', message);
            return false;
        }

        const rawRounds = room.lobbyOptions?.roundsCount || (room.lobbyOptions?.gameMode === 'DUEL' ? 5 : 10);
        const roundsCount = Math.min(20, Math.max(1, Number(rawRounds) || 10));

        let rounds: GameRound[];
        try {
            rounds = this.roundManager.generateGameRounds(playableTracks, roundsCount);
        } catch (err) {
            const message = (err as Error)?.message || 'Failed to generate game rounds';
            if (isSystemLaunch) {
                throw err instanceof Error ? err : new Error(message);
            }
            client?.emit('gameError', message);
            return false;
        }

        this.roundManager.cancelRoomGame(room.id);

        room.gameData = {
            ...selectedTracks,
            tracks: playableTracks,
        };
        room.state = GameRoomState.STARTED;
        const playerResults = createInitialPlayerResults(room.players);

        const totalScores: Record<number, number> = room.players.reduce(
            (acc, player) => {
                acc[player.id] = 0;
                return acc;
            },
            {} as Record<number, number>,
        );

        const initialHeardleTiers: Record<number, Record<number, number>> | undefined =
            room.lobbyOptions?.gameMode === 'HEARDLE'
                ? room.players.reduce(
                      (acc, player) => {
                          acc[player.id] = { 0: 1 };
                          return acc;
                      },
                      {} as Record<number, Record<number, number>>,
                  )
                : undefined;

        room.gameProgress = {
            currentRound: 0,
            rounds,
            playerResults,
            totalScores,
            streaks: {},
            ...(initialHeardleTiers ? { heardleUnlockedTiers: initialHeardleTiers } : {}),
        };

        this.roomManager.syncRoom(room);
        this.roundManager.startRound(room.id, 0, rounds[0]);
        return true;
    }

    handleAnswer(client: Socket, roomId: string, roundNumber: number, answer: string, snippetDurationUsed?: number) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room?.gameProgress) return;
        if (room.state !== GameRoomState.STARTED) return;

        const playerId = client.data.user?.id;
        if (!playerId) return;

        const isMember = room.players.some((p) => p.id === playerId);
        if (!isMember) return;

        const { rounds, playerResults } = room.gameProgress;

        if (typeof roundNumber !== 'number' || roundNumber !== room.gameProgress.currentRound) return;
        if (!rounds[roundNumber] || (rounds[roundNumber] as { isFinished?: boolean }).isFinished) return;

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
        const validClientTier =
            typeof snippetDurationUsed === 'number' &&
            Number.isFinite(snippetDurationUsed) &&
            (VALID_HEARDLE_TIERS as readonly number[]).includes(snippetDurationUsed)
                ? snippetDurationUsed
                : undefined;
        const elapsedMs = Math.max(0, Date.now() - round.startedAt);
        const minTierByElapsed = inferMinHeardleTierFromElapsed(elapsedMs);
        const effectiveSnippetDuration =
            gameMode === 'HEARDLE'
                ? Math.max(
                      validClientTier !== undefined ? Math.max(recordedSnippet, validClientTier) : recordedSnippet,
                      minTierByElapsed,
                  )
                : snippetDurationUsed;

        playerResults[playerId][roundNumber] = createPlayerRoundResult(
            round,
            answer,
            answerMode,
            effectiveSnippetDuration,
        );

        this.roomManager.syncRoom(room);
        this.server?.to(room.id).emit('playerAnswered', { playerId, roundNumber });

        // У режимі DUEL, якщо гравець дав правильну відповідь — раунд фінішує негайно!
        const result = playerResults[playerId][roundNumber];
        if (gameMode === 'DUEL' && result.isCorrect) {
            this.roundManager.finishRound(room.id, roundNumber);
            return;
        }

        const allAnswered = checkAllPlayersAnswered(playerResults, roundNumber, room.players);
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
        if (!Number.isFinite(snippetDuration) || ![1, 2, 5, 10, 20].includes(snippetDuration)) return;

        const isMember = room.players.some((p) => p.id === playerId);
        if (!isMember) return;
        if (roundNumber !== room.gameProgress.currentRound) return;

        const round = room.gameProgress.rounds[roundNumber];
        if (!round || (round as { isFinished?: boolean }).isFinished) return;

        if (!room.gameProgress.heardleUnlockedTiers) {
            room.gameProgress.heardleUnlockedTiers = {};
        }
        if (!room.gameProgress.heardleUnlockedTiers[playerId]) {
            room.gameProgress.heardleUnlockedTiers[playerId] = {};
        }
        const currentMax = room.gameProgress.heardleUnlockedTiers[playerId][roundNumber] || 1;
        room.gameProgress.heardleUnlockedTiers[playerId][roundNumber] = Math.max(currentMax, snippetDuration);
        this.roomManager.syncRoom(room);
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
        if (this.reactionCooldowns.size > 500) {
            for (const [uid, ts] of this.reactionCooldowns) {
                if (now - ts > 60000) {
                    this.reactionCooldowns.delete(uid);
                }
            }
        }
        this.reactionCooldowns.set(playerId, now);

        this.server?.to(room.id).emit('playerReaction', {
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
        this.server?.to(room.id).emit('gameRestarted', sanitizeRoom(room));
    }
}
