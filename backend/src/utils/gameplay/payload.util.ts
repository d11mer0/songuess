import { GameRound } from '../../game/interfaces/game-progress.interface';

export function formatRoundPayload(round: GameRound) {
    return {
        roundNumber: round.roundNumber,
        options: round.options,
        startedAt: round.startedAt,
        endsAt: round.startedAt + 25000,
        preview: round.track.preview,
    };
}
