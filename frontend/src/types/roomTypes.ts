export interface Player {
    id: number;
    login: string;
    isOnline: boolean;
}

export interface LobbyOptions {
    allowAutoJoin: boolean;
    publicLobby: boolean;
    maxPlayers: number;
}

export enum RoomState {
    ADDING = 'adding', // Коли гравці ще приєднуються (лоббі)
    CREATING = 'creating', // Коли налаштовується гра (вибір альбомів/артиста/плейліста)
    STARTED = 'started', // Коли гра запущена
    ENDED = 'ended',
}

export interface Room {
    id: string;
    players: Player[];
    lobbyOptions: LobbyOptions;
    leaderId?: number;
    state: RoomState;
}
