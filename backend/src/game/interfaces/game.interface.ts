export interface Player {
    id: string;
    login: string;
}
  
export interface GameRoom {
    id: string;
    players: Player[];
}
  