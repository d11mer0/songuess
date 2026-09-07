import { Player, AnswerMode } from '../../game/interfaces/game.interface';
import { PlayerRoundResult, GameRound } from '../../game/interfaces/game-progress.interface';
import { isFuzzyMatch } from './fuzzy-match.util';

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
    answerMode: AnswerMode = 'MULTIPLE_CHOICE',
    snippetDurationUsed?: number,
): PlayerRoundResult {
    const timeTaken = Date.now() - round.startedAt;
    let isCorrect = false;
    let matchSimilarity = 0;

    if (answerMode === 'TYPE_IN') {
        const match = isFuzzyMatch(answer, round.track.title, round.track.artistName);
        isCorrect = match.isMatch;
        matchSimilarity = match.similarity;
    } else {
        isCorrect = answer === round.track.title;
        matchSimilarity = isCorrect ? 1 : 0;
    }

    return {
        answer,
        isCorrect,
        timeTaken,
        score: 0,
        snippetDurationUsed,
        matchSimilarity,
    };
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