import { AnswerMode } from '../../game/interfaces/game.interface';
import { GameRound } from '../../game/interfaces/game-progress.interface';

export function formatRoundPayload(
    round: GameRound,
    durationMs: number = 25000,
    answerMode: AnswerMode = 'MULTIPLE_CHOICE',
) {
    return {
        roundNumber: round.roundNumber,
        options: answerMode === 'TYPE_IN' ? [] : round.options,
        startedAt: round.startedAt,
        endsAt: round.startedAt + durationMs,
        serverTime: Date.now(),
        preview: round.track.preview,
    };
}
