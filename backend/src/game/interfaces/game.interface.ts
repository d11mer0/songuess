import { GameProgress } from './game-progress.interface';
import { SelectedTracks } from './tracks.interface';

export interface Player {
    id: number;
    login: string;
    isOnline: boolean;
    avatar: string | null;
}

export interface LobbyOptions {
    allowAutoJoin: boolean;
    publicLobby: boolean;
    maxPlayers: number;
}

export enum GameRoomState {
    ADDING = 'adding', // Коли гравці ще приєднуються (лоббі)
    CREATING = 'creating', // Коли налаштовується гра (вибір альбомів/артиста/плейліста)
    STARTED = 'started', // Коли гра запущена
    ENDED = 'ended',
}

export interface GameRoom {
    id: string;
    players: Player[];
    lobbyOptions: LobbyOptions;
    leaderId: number;
    state: GameRoomState;
    gameData?: SelectedTracks;
    gameProgress?: GameProgress;
}
