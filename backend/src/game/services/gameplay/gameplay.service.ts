import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game/game.service';
import { RoomHelperService } from '../room/room-helper.service';
import { RoomManagerService } from '../room/room-manager.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { SelectedTracks, TrackItem } from '../../interfaces/tracks.interface';
import { createInitialPlayerResults, validateAnswerSubmission, createPlayerRoundResult} from '../../../utils/gameplay/player-results.utils';
import {checkAllPlayersAnswered } from '../../../utils/gameplay/round.util';
import { RoundManagerService } from './round-manager.service';
import { GameEventsService } from './game-events.service';
import { GameResultService } from './game-result.service';

@Injectable()
export class GameplayService {
    private server: Server | null = null;

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

        room.gameData = selectedTracks;
        room.state = GameRoomState.STARTED;

        const roundsCount = room.lobbyOptions?.roundsCount || (room.lobbyOptions?.gameMode === 'DUEL' ? 5 : 10);
        const rounds = this.roundManager.generateGameRounds(selectedTracks.tracks, roundsCount);
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
        this.roundManager.startRound(roomId, 0, rounds[0]);
    }

    handleAnswer(client: Socket, roomId: string, roundNumber: number, answer: string, snippetDurationUsed?: number) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room?.gameProgress) return;

        const playerId = client.data.user.id;
        const { rounds, playerResults } = room.gameProgress;

        if (!validateAnswerSubmission(playerResults, playerId, roundNumber)) return;

        const round = rounds[roundNumber];
        const answerMode = room.lobbyOptions?.answerMode || 'MULTIPLE_CHOICE';
        const gameMode = room.lobbyOptions?.gameMode || 'CLASSIC';

        playerResults[playerId][roundNumber] = createPlayerRoundResult(
            round,
            answer,
            answerMode,
            snippetDurationUsed,
        );

        this.roomManager.syncRoom(room);

        // У режимі DUEL, якщо гравець дав правильну відповідь — раунд фінішує негайно!
        const result = playerResults[playerId][roundNumber];
        if (gameMode === 'DUEL' && result.isCorrect) {
            this.roundManager.finishRound(roomId, roundNumber);
            return;
        }

        const allAnswered = checkAllPlayersAnswered(playerResults, roundNumber, room.players.length);
        if (allAnswered) {
            this.roundManager.finishRound(roomId, roundNumber);
        }
    }

    handleRestartGame(client: Socket, roomId: string) {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room) return;

        room.state = GameRoomState.CREATING;
        room.gameData = undefined;
        room.gameProgress = undefined;

        room.players = room.players.map(player => ({ ...player, totalScore: 0 }));
        
        this.roomManager.syncRoom(room);
        this.server?.to(roomId).emit('gameRestarted', room);
    }
}
