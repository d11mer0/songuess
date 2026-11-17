import { GameRound } from '../../game/interfaces/game-progress.interface';

export function formatRoundPayload(round: GameRound, durationMs: number = 25000) {
    return {
        roundNumber: round.roundNumber,
        options: round.options,
        startedAt: round.startedAt,
        endsAt: round.startedAt + durationMs,
        serverTime: Date.now(),
        preview: round.track.preview,
    };
}
