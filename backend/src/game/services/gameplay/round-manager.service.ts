import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameRoom, Player, GameRoomState } from '../../interfaces/game.interface';
import { GameRound, PlayerRoundResult, GameProgress } from '../../interfaces/game-progress.interface';
import { shuffleArray } from '../../../utils/array';
import { assignMissedAnswers } from '../../../utils/gameplay/player-results.utils';
import { isGameFinished, prepareNextRound, buildGameRound } from '../../../utils/gameplay/round.util';
import { ScoringService } from './scoring.service';
import { GameResultService } from './game-result.service';
import { GameEventsService } from './game-events.service';

const ROUND_DURATION_MS = 25000;
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
    ) {}

    setServer(server: Server) {
        this.server = server;
    }

    generateGameRounds(tracks: any[], roundsCount: number = ROUNDS_NUMBER): GameRound[] {
        const count = Math.min(tracks.length, roundsCount);
        if (count < 3) {
            throw new Error('Not enough tracks to generate round options');
        }
        
        const selectedTracks = shuffleArray(tracks).slice(0, count);
        return selectedTracks.map((track, index) => buildGameRound(track, tracks, index));
    }

    startRound(roomId: string, roundNumber: number, round: GameRound) {
        this.startRoundTimeout(roomId, roundNumber);
        this.gameEvents.emitRoundEvent(roomId, round);
    }

    finishRound(roomId: string, roundNumber: number) {
        const room = this.gameEvents.getRoom(roomId);
        if (!room?.gameProgress) return;
        if (room.gameProgress.currentRound !== roundNumber) return;

        const { rounds, playerResults } = room.gameProgress;
        const round = rounds[roundNumber];
        if (!round || (round as any).isFinished) return;
        (round as any).isFinished = true;

        this.clearExistingTimeout(roomId);
        this.clearPauseTimeout(roomId);

        assignMissedAnswers(playerResults, room.players, roundNumber);

        this.scoring.calculateRoundScores(room, roundNumber);
        this.gameEvents.emitRoundResults(round, roundNumber, playerResults, room.players, room.gameProgress, roomId);

        const timer = setTimeout(() => {
            this.pauseTimeouts.delete(roomId);
            this.startNextRound(roomId);
        }, ROUND_PAUSE_MS);
        this.pauseTimeouts.set(roomId, timer);
    }

    cancelRoomGame(roomId: string) {
        this.clearExistingTimeout(roomId);
        this.clearPauseTimeout(roomId);
    }

    private startNextRound(roomId: string) {
        const room = this.gameEvents.getRoom(roomId);
        if (!room?.gameProgress || room.state !== GameRoomState.STARTED) return;

        if (isGameFinished(room)) {
            this.gameResult.finishGame(room);
            return;
        }

        const nextRound = prepareNextRound(room);
        this.startRound(roomId, nextRound.roundNumber, nextRound);
    }

    private startRoundTimeout(roomId: string, roundNumber: number) {
        this.clearExistingTimeout(roomId);
        const room = this.gameEvents.getRoom(roomId);
        const durationSec = Math.min(25, Math.max(5, room?.lobbyOptions?.roundDuration || 25));
        const timeout = setTimeout(() => this.finishRound(roomId, roundNumber), durationSec * 1000);
        this.roundTimeouts.set(roomId, timeout);
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