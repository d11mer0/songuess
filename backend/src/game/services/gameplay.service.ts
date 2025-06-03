import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomManagerService } from './room/room-manager.service';
import { GameService } from './game.service';
import { RoomHelperService } from './room/room-helper.service';
import { GameRoom, GameRoomState, Player } from '../interfaces/game.interface';
import { SelectedTracks, TrackItem } from '../interfaces/tracks.interface';
import { GameRound, PlayerRoundResult } from '../interfaces/game-progress.interface';
import { shuffleArray } from '../../utils/array';
import {
    createInitialPlayerResults,
    validateAnswerSubmission,
    checkAllPlayersAnswered,
    createPlayerRoundResult,
    assignMissedAnswers,
    isGameFinished,
    prepareNextRound,
    formatRoundPayload,
    buildGameRound
} from '../../utils/gameplay-utils';


const ROUND_DURATION_MS = 25000;
const ROUND_PAUSE_MS = 3000;
const ROUNDS_NUMBER = 10;
@Injectable()
export class GameplayService {
    private server: Server | null = null;
    private roundTimeouts = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly roomHelperService: RoomHelperService,
        private readonly gameService: GameService
    ) {}

    setServer(server: Server) {
        this.server = server;
    }

    handleLaunchGame(client: Socket, roomId: string, selectedTracks: SelectedTracks) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room) return;
        room.gameData = selectedTracks;
        room.state = GameRoomState.STARTED;

        const rounds = this.generateGameRounds(selectedTracks.tracks);
        const playerResults = createInitialPlayerResults(room.players);

        room.gameProgress = {
            currentRound: 0,
            rounds,
            playerResults,
        };
        const firstRound = rounds[0];

        this.startRoundTimeout(roomId, 0);
        this.emitRoundEvent(roomId, firstRound);
    }

    handleAnswer(
        client: Socket,
        roomId: string,
        roundNumber: number,
        answer: string,
    ) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room || !room.gameProgress) return;

        const playerId = client.data.user.id;
        const { rounds, playerResults } = room.gameProgress;

        if (!validateAnswerSubmission(playerResults, playerId, roundNumber))
            return;

        const round = rounds[roundNumber];
        const result = createPlayerRoundResult(round, answer);
        playerResults[playerId][roundNumber] = result;
        const allAnswered = checkAllPlayersAnswered(
            playerResults,
            roundNumber,
            room.players.length,
        );

        if (allAnswered) {
            this.clearExistingTimeout(roomId);
            this.finishRound(roomId, roundNumber);
        }
    }

    private finishRound(roomId: string, roundNumber: number) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room || !room.gameProgress) return;

        this.clearExistingTimeout(roomId);

        const { rounds, playerResults } = room.gameProgress;
        const round = rounds[roundNumber];
        assignMissedAnswers(playerResults, room.players, roundNumber);
        this.emitRoundResults(round, roundNumber, playerResults, room.players);

        setTimeout(() => {
            this.startNextRound(roomId);
        }, ROUND_PAUSE_MS);
    }

    private startNextRound(roomId: string) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room || !room.gameProgress) return;
        
        if (isGameFinished(room)) {
            this.finishGame(room);
            return;
        }

        const nextRound = prepareNextRound(room);
        this.startRoundTimeout(roomId, nextRound.roundNumber);
        this.emitRoundEvent(roomId, nextRound);
    }
    
    generateGameRounds(tracks: TrackItem[]): GameRound[] {
        if (tracks.length < ROUNDS_NUMBER) {
            throw new Error('Not enough tracks to generate round options');
        }

        const selectedTracks = shuffleArray(tracks).slice(0, 9);
        return selectedTracks.map((track, index) =>
            buildGameRound(track, tracks, index)
        );      
    }

    private startRoundTimeout(roomId: string, roundNumber: number): void {
        const timeout = setTimeout(() => {
            this.finishRound(roomId, roundNumber);
        }, ROUND_DURATION_MS);
        this.roundTimeouts.set(roomId, timeout);
    }

    private emitRoundEvent(roomId: string, round: GameRound): void {
        const payload = formatRoundPayload(round);
        this.server?.to(roomId).emit('roundStarted', payload);
    }

    private clearExistingTimeout(roomId: string): boolean {
        const existingTimeout = this.roundTimeouts.get(roomId);
        if (!existingTimeout) return false;

        clearTimeout(existingTimeout);
        this.roundTimeouts.delete(roomId);
        return true;
    }

    private emitRoundResults(
        round: GameRound,
        roundNumber: number,
        playerResults: Record<number, Record<number, PlayerRoundResult>>,
        players: Player[],
    ) {
        for (const player of players) {
            const socket = this.gameService.getClientSocketByUserId(player.id);
            const result = playerResults[player.id][roundNumber];
            socket?.emit('roundResult', {
                correctAnswer: round.track.title,
                answer: result.answer,
                timeTaken: result.timeTaken,
            });
        }
    }

    private finishGame(room: GameRoom): void {
        this.server?.to(room.id).emit('gameEnded', {
            results: room.gameProgress!.playerResults,
        });
        room.state = GameRoomState.ENDED;
    }
}
