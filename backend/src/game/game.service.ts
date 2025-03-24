import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
interface Player {
  id: string;
  login: string;
}

interface GameRoom {
  id: string;
  players: Player[];
}

@Injectable()
export class GameService {
  private rooms: GameRoom[] = [];
  private server: Server | null = null; // Додаємо поле для WebSocket сервера

  setServer(server: Server) {
    this.server = server;
  }
  // 🔹 Створення кімнати
  createRoom(playerId: string, login: string): string {
    const roomId = Math.random().toString(36).substring(2, 9);
    const newRoom: GameRoom = { id: roomId, players: [{ id: playerId, login }] };
    this.rooms.push(newRoom);
    this.broadcastRoomsList();
    return roomId;
  }

  joinRoom(roomId: string, playerId: string, login: string): boolean {
    const room = this.rooms.find(room => room.id === roomId);
    if (room && room.players.length < 2) {
      room.players.push({ id: playerId, login });
      return true;
    }
    this.broadcastRoomsList();
    return false;
  }

  getRoomInfo(roomId: string): GameRoom {
    return this.rooms.find(room => room.id === roomId) || { id: roomId, players: [] };
  }

  leaveGame(playerId: string) {
    this.rooms.forEach(room => {
      room.players = room.players.filter(player => player.id !== playerId);
    });
    this.rooms = this.rooms.filter(room => room.players.length > 0);
    this.broadcastRoomsList();
  }
  
  findRoom(roomId: string) {
      return this.rooms.find(room => room.id === roomId);
  }
  
  findRoomByPlayerId(playerId: string): GameRoom | undefined {
    return this.rooms.find(room => room.players.some(player => player.id === playerId));
  }
  
  isUserInRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.find(room => room.id === roomId);
    return room ? room.players.some(player => player.id === playerId) : false;
  }

  getAllRooms(): GameRoom[] {
    return this.rooms.map(room => ({
        id: room.id,
        players: room.players,
        maxPlayers: 2, // Потім можна зробити динамічним
    }));
  }


  private broadcastRoomsList() {
    if (this.server) {
      this.server.emit('roomsList', this.getAllRooms());
    }
  }

}