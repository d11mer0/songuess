export interface Player {
    id: number;
    login: string;
    isOnline: boolean;
    avatar: string | null;
    totalScore?: number;
    streak?: number;
}

export type GameMode = 'CLASSIC' | 'HEARDLE' | 'DUEL';
export type AnswerMode = 'MULTIPLE_CHOICE' | 'TYPE_IN';

export interface LobbyOptions {
    allowAutoJoin: boolean;
    publicLobby: boolean;
    maxPlayers: number;
    gameMode?: GameMode;
    answerMode?: AnswerMode;
    roundsCount?: number;
}

export enum RoomState {
    ADDING = 'adding', // Коли гравці ще приєднуються (лоббі)
    CREATING = 'creating', // Коли налаштовується гра (вибір альбомів/артиста/плейліста)
    STARTED = 'started', // Коли гра запущена
    ENDED = 'ended',
}

export interface Room {
    id: string;
    shortCode?: string;
    players: Player[];
    lobbyOptions: LobbyOptions;
    leaderId?: number;
    state: RoomState;
}
