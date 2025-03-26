export interface Player {
    id: string;
    login: string;
}

export interface RoomInfo {
    id: string;
    players: Player[];
}

export interface Room {
    id: string;
    maxPlayers: number;
    players: Player[];
}
