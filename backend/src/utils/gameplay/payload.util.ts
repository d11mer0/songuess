import { GameRound } from '../../game/interfaces/game-progress.interface';

export function formatRoundPayload(round: GameRound) {
    return {
        roundNumber: round.roundNumber,
        options: round.options,
        startedAt: round.startedAt,
        preview: round.track.preview,
    };
}
