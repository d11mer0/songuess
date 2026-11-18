import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { GameRound } from '../../interfaces/game-progress.interface';
import { shuffleArray } from '../../../utils/array';
import { assignMissedAnswers } from '../../../utils/gameplay/player-results.utils';
import { isGameFinished, prepareNextRound, buildGameRound } from '../../../utils/gameplay/round.util';
import { filterTracks } from '../../../utils/track-utils';
import { ScoringService } from './scoring.service';
import { GameResultService } from './game-result.service';
import { GameEventsService } from './game-events.service';
import { RoomManagerService } from '../room/room-manager.service';

const ROUND_PAUSE_MS = 5000;
const ROUNDS_NUMBER = 10;

@Injectable()
export class RoundManagerService {
    private server: Server | null = null;
    private roundTimeouts = new Map<string, NodeJS.Timeout>();
    private pauseTimeouts = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly scoring: ScoringService,
        private readonly gameResult: GameResultService,
        private readonly gameEvents: GameEventsService,
        @Optional()
        @Inject(forwardRef(() => RoomManagerService))
        private readonly roomManager?: RoomManagerService,
    ) {}

    setServer(server: Server) {
        this.server = server;
    }

    private resolveCanonicalId(roomId: string): string {
        const room = this.gameEvents.getRoom(roomId);
        return room ? room.id : roomId;
    }

    generateGameRounds(tracks: any[], roundsCount: number = ROUNDS_NUMBER): GameRound[] {
        const playableTracks = filterTracks(tracks || []);
        const count = Math.min(playableTracks.length, roundsCount);
        if (count < 3) {
            throw new Error('Not enough tracks to generate round options');
        }

        const selectedTracks = shuffleArray(playableTracks).slice(0, count);
        return selectedTracks.map((track, index) => buildGameRound(track, playableTracks, index));
    }

    startRound(roomId: string, roundNumber: number, round: GameRound) {
        const canonicalId = this.resolveCanonicalId(roomId);
        const room = this.gameEvents.getRoom(canonicalId);
        if (room?.lobbyOptions?.gameMode === 'HEARDLE' && room.gameProgress) {
            if (!room.gameProgress.heardleUnlockedTiers) {
                room.gameProgress.heardleUnlockedTiers = {};
            }
            for (const player of room.players) {
                if (!room.gameProgress.heardleUnlockedTiers[player.id]) {
                    room.gameProgress.heardleUnlockedTiers[player.id] = {};
                }
                if (!room.gameProgress.heardleUnlockedTiers[player.id][roundNumber]) {
                    room.gameProgress.heardleUnlockedTiers[player.id][roundNumber] = 1;
                }
            }
        }
        round.startedAt = Date.now();
        this.startRoundTimeout(canonicalId, roundNumber);
        this.gameEvents.emitRoundEvent(canonicalId, round);
    }

    finishRound(roomId: string, roundNumber: number) {
        const room = this.gameEvents.getRoom(roomId);
        if (!room?.gameProgress) return;
        const canonicalId = room.id;
        if (room.gameProgress.currentRound !== roundNumber) return;

        const { rounds, playerResults } = room.gameProgress;
        const round = rounds[roundNumber];
        if (!round || (round as { isFinished?: boolean }).isFinished) return;
        (round as { isFinished?: boolean }).isFinished = true;

        this.clearExistingTimeout(canonicalId);
        this.clearPauseTimeout(canonicalId);
        if (roomId !== canonicalId) {
            this.clearExistingTimeout(roomId);
            this.clearPauseTimeout(roomId);
        }

        assignMissedAnswers(playerResults, room.players, roundNumber);

        this.scoring.calculateRoundScores(room, roundNumber);
        this.roomManager?.syncRoom(room)?.catch((err) => {
            console.error('Failed to sync room after finishRound:', err);
        });
        this.gameEvents.emitRoundResults(round, roundNumber, playerResults, room.players, room.gameProgress, canonicalId);

        const timer = setTimeout(() => {
            this.pauseTimeouts.delete(canonicalId);
            this.startNextRound(canonicalId);
        }, ROUND_PAUSE_MS);
        this.pauseTimeouts.set(canonicalId, timer);
    }

    clearRoomTimers(roomId: string) {
        this.cancelRoomGame(roomId);
    }

    cancelRoomGame(roomId: string) {
        const canonicalId = this.resolveCanonicalId(roomId);
        this.clearExistingTimeout(canonicalId);
        this.clearPauseTimeout(canonicalId);
        if (roomId !== canonicalId) {
            this.clearExistingTimeout(roomId);
            this.clearPauseTimeout(roomId);
        }
    }

    private startNextRound(roomId: string) {
        const room = this.gameEvents.getRoom(roomId);
        if (!room?.gameProgress || room.state !== GameRoomState.STARTED) return;
        const canonicalId = room.id;

        if (isGameFinished(room)) {
            this.gameResult.finishGame(room).catch((err) => {
                console.error('finishGame error:', err);
            });
            return;
        }

        const nextRound = prepareNextRound(room);
        this.startRound(canonicalId, nextRound.roundNumber, nextRound);
        this.roomManager?.syncRoom(room)?.catch((err) => {
            console.error('Failed to sync room after startNextRound:', err);
        });
    }

    private startRoundTimeout(roomId: string, roundNumber: number) {
        const room = this.gameEvents.getRoom(roomId);
        const canonicalId = room ? room.id : roomId;
        this.clearExistingTimeout(canonicalId);
        const durationSec = Math.min(25, Math.max(5, room?.lobbyOptions?.roundDuration || 25));
        const timeout = setTimeout(() => this.finishRound(canonicalId, roundNumber), durationSec * 1000);
        this.roundTimeouts.set(canonicalId, timeout);
    }

    private clearExistingTimeout(roomId: string): boolean {
        const existing = this.roundTimeouts.get(roomId);
        if (!existing) return false;
        clearTimeout(existing);
        this.roundTimeouts.delete(roomId);
        return true;
    }

    private clearPauseTimeout(roomId: string): boolean {
        const existing = this.pauseTimeouts.get(roomId);
        if (!existing) return false;
        clearTimeout(existing);
        this.pauseTimeouts.delete(roomId);
        return true;
    }
}
