import { Player } from '../../game/interfaces/game.interface';
import { PlayerRoundResult, GameRound } from '../../game/interfaces/game-progress.interface';

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
    return { answer, isCorrect, timeTaken, score: 0 };
}

export function assignMissedAnswers(
    playerResults: Record<number, Record<number, PlayerRoundResult>>,
    players: Player[],
    roundNumber: number,
): void {
    for (const player of players) {
        if (!playerResults[player.id]?.[roundNumber]) {
            playerResults[player.id][roundNumber] = {
                answer: null,
                isCorrect: false,
                timeTaken: null,
                score: 0,
            };
        }
    }
}

