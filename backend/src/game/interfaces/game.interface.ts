export interface Player {
    id: number;
    login: string;
}
  
export interface GameRoom {
    id: string;
    players: Player[];
}
  