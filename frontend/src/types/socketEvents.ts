import { LobbyOptions, Room } from './roomTypes';
import { GameRoundPublicData, SelectedTracks } from './gameTypes';
import { GameEndedPayload } from './gameEndedTypes';

// Події, які клієнт надсилає серверу
export interface ClientToServerEvents {
    reconnectRoom: () => void;
    getCurrentRoom: () => void;
    getRooms: () => void;
    createRoom: (payload: Partial<LobbyOptions>) => void;
    joinRoom: (payload: { id: string }) => void;
    joinRoomByCode: (payload: { code: string }) => void;
    autoJoinRoom: () => void;
    leaveRoom: (payload?: { id?: string }) => void;
    deleteRoom: (payload?: { id?: string }) => void;
    kickMember: (payload: { roomId: string; memberId: number }) => void;
    startGame: (payload: { id: string }) => void;
    switchPartyMode: (payload: { roomId: string; isPartyMode: boolean }) => void;
    launchGame: (payload: { roomId: string; selectedTracks: SelectedTracks }) => void;
    restartGame: (payload: { roomId: string }) => void;
    submitAnswer: (payload: {
        roomId: string;
        roundNumber: number;
        answer: string;
        snippetDurationUsed?: number;
    }) => void;
    unlockHeardleSnippet: (payload: {
        roomId: string;
        roundNumber: number;
        snippetDuration: number;
    }) => void;
    sendReaction: (payload: { roomId: string; emoji: string }) => void;
    findDuelMatch: () => void;
    cancelDuelMatch: () => void;
}

// Події, які сервер надсилає клієнту
export interface ServerToClientEvents {
    roomCreated: (room: Room) => void;
    joinedRoom: (room: Room | null) => void;
    currentRoom: (room: Room | null) => void;
    roomsList: (rooms: Room[]) => void;
    playerLeft: (room: Room) => void;
    playerDisconnected: (room: Room) => void;
    roomDeleted: (data: { roomId?: string; error?: string }) => void;
    gameStarted: (room: Room) => void;
    gameRestarted: (room: Room) => void;
    gameFinished: () => void;
    partyModeSwitched: (payload: {
        roomId: string;
        shortCode?: string;
        isPartyMode: boolean;
        room: Room;
    }) => void;
    roundStarted: (payload: GameRoundPublicData) => void;
    reconnectToRound: (
        payload: GameRoundPublicData & { answer: string | null; heardleUnlockedTier?: number },
    ) => void;
    reconnectFailed: () => void;
    playerAnswered: (payload: { playerId: number; roundNumber: number }) => void;
    roundResult: (payload: {
        correctAnswer: string;
        results: {
            playerId: number;
            answer: string | null;
            isCorrect?: boolean;
            score: number;
            totalScore: number;
            timeTaken: number | null;
            streak?: number;
        }[];
        streaks?: Record<number, number>;
    }) => void;
    gameEnded: (payload: GameEndedPayload) => void;
    artistMatchHint: (payload: { roundNumber: number; artistName: string }) => void;
    playerReaction: (payload: { playerId: number; emoji: string; timestamp: number }) => void;
    duelQueueStatus: (payload: { status: string; queueSize?: number }) => void;
    duelMatchFound: (payload: {
        roomId: string;
        room: Room;
        opponent1: string;
        opponent2: string;
    }) => void;
    duelError: (message: string) => void;
}
