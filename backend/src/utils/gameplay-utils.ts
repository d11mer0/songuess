import { GameRoom, Player } from '../game/interfaces/game.interface';
import {
    PlayerRoundResult,
    GameRound,
    RoundTrack
} from '../game/interfaces/game-progress.interface';

import { TrackItem } from '../game/interfaces/tracks.interface';

import { pickRandomWrongOptions, shuffleArray } from './array';

export function createInitialPlayerResults(
    players: Player[],
): Record<number, Record<number, PlayerRoundResult>> {
    return players.reduce(
        (acc, player) => {
            acc[player.id] = {};
            return acc;
        },
        {} as Record<number, Record<number, PlayerRoundResult>>,
    );
}

export function validateAnswerSubmission(
    playerResults: Record<number, Record<number, PlayerRoundResult>>,
    playerId: number,
    roundNumber: number,
): boolean {
    const existingResult = playerResults[playerId]?.[roundNumber];
    return !existingResult;
}

export function createPlayerRoundResult(
    round: GameRound,
    answer: string,
): PlayerRoundResult {
    const timeTaken = Date.now() - round.startedAt;
    const isCorrect = answer === round.track.title;
    const score = 0; //ТУТ ТРЕБА ПОРАХУВАТИ СКОР ПО ФОРМУЛІ
    return {
        answer,
        isCorrect,
        timeTaken,
        score
    };
}

export function checkAllPlayersAnswered(
    playerResults: Record<number, Record<number, PlayerRoundResult>>,
    roundNumber: number,
    totalPlayers: number,
): boolean {
    const answeredPlayers = Object.values(playerResults).filter(
        (results) => results[roundNumber] !== undefined,
    ).length;

    return answeredPlayers === totalPlayers;
}

export function assignMissedAnswers(
    playerResults: Record<number, Record<number, PlayerRoundResult>>,
    players: Player[],
    roundNumber: number,
): void {
    for (const player of players) {
        const result = playerResults[player.id]?.[roundNumber];
        if (result === undefined) {
            playerResults[player.id][roundNumber] = {
                answer: null,
                isCorrect: false,
                timeTaken: null,
                score: 0
            };
        }
    }
}

export function isGameFinished(room: GameRoom): boolean {
    const { currentRound, rounds } = room.gameProgress!;
    return currentRound + 1 >= rounds.length;
}
    

export function prepareNextRound(room: GameRoom): GameRound {
    const nextRoundNumber = room.gameProgress!.currentRound + 1;
    const nextRound = room.gameProgress!.rounds[nextRoundNumber];
    
    nextRound.startedAt = Date.now();
    room.gameProgress!.currentRound = nextRoundNumber;

    return nextRound;
}

export function formatRoundPayload(round: GameRound) {
    return {
        roundNumber: round.roundNumber,
        options: round.options,
        startedAt: round.startedAt,
        preview: round.track.preview,
    };
}


export function buildGameRound(
    correctTrack: TrackItem,
    allTracks: TrackItem[],
    roundIndex: number
): GameRound {
    
    const wrongOptions = pickRandomWrongOptions(allTracks, correctTrack.id, 3);
    const options = shuffleArray([correctTrack.title, ...wrongOptions]);

    const roundTrack: RoundTrack = {
        id: correctTrack.id,
        title: correctTrack.title,
        preview: correctTrack.preview,
        artistName: correctTrack.artist?.name,
        albumName: correctTrack.album?.title,
    };

    return {
        roundNumber: roundIndex,
        track: roundTrack,
        options,
        startedAt: Date.now(),
    };
}

export function calculateScore(
    timeTaken: number,
    isCorrect: boolean,
    isFirst: boolean
): number {
    if (!isCorrect || timeTaken === null) return 0;
    const rawScore = Math.max(0, 25000 - timeTaken) / 10; // кожна 0.01 секунда = 1 очко

    const normalizedScore = parseFloat((rawScore / 25).toFixed(2)); // шкала до 100
    let finalScore = normalizedScore + 100; // бонус за правильну відповідь

    if (isFirst) {
        finalScore += 20; // бонус за першість
    }

    return parseFloat(finalScore.toFixed(2));
}
