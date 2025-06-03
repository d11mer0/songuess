import { Room, RoomState } from './roomTypes';
import { GameRoundPublicData, SelectedTracks } from './gameTypes';

// Події, які клієнт надсилає серверу
export interface ClientToServerEvents {
  reconnectRoom: () => void;
  deleteRoom: (payload: { id: string }) => void;
  kickMember: (payload: { roomId: string; memberId: number }) => void;
  launchGame: (payload: { roomId: string; selectedTracks: SelectedTracks }) => void;
  submitAnswer: (payload: {
    roomId: string;
    roundNumber: number;
    answer: string;
  }) => void;
}

// Події, які сервер надсилає клієнту
export interface ServerToClientEvents {
  joinedRoom: (room: Room) => void;
  playerLeft: (room: Room) => void;
  playerDisconnected: (room: Room) => void;
  roomDeleted: (data: { roomId?: string; error?: string }) => void;
  roundStarted: (payload: GameRoundPublicData) => void;
  reconnectToRound: (payload: GameRoundPublicData & { answer: string | null }) => void;
  roundResult: (payload: {
    correctAnswer: string;
    answer: string;
    timeTaken: number;
  }) => void;
  gameEnded: () => void;
}
