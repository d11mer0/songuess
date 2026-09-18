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

        const userId = client.data.user?.id;
        if (room.leaderId !== userId) return;
        if (room.state === GameRoomState.STARTED) return;
        if (!selectedTracks?.tracks || selectedTracks.tracks.length < 3) return;

        this.roundManager.cancelRoomGame(room.id);

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

        playerResults[playerId][roundNumber] = createPlayerRoundResult(
            round,
            answer,
            answerMode,
            snippetDurationUsed,
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
            this.roundManager.finishRound(roomId, roundNumber);
        }
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
        this.server?.to(roomId).emit('gameRestarted', room);
    }
}
