import { GameRoom } from '../../game/interfaces/game.interface';
import { GameRound, RoundTrack } from '../../game/interfaces/game-progress.interface';
import { TrackItem } from '../../game/interfaces/tracks.interface';
import { pickRandomWrongOptions, shuffleArray } from '../array';

export function checkAllPlayersAnswered(
    playerResults: Record<number, Record<number, any>>,
    roundNumber: number,
    totalPlayers: number,
): boolean {
    const answered = Object.values(playerResults).filter(r => r[roundNumber] !== undefined).length;
    return answered === totalPlayers;
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