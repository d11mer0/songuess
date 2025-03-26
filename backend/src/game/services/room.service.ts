import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GameRoom, Player } from '../interfaces/game.interface';
import { GameService } from './game.service';

@Injectable()
export class RoomService {
  private rooms: GameRoom[] = [];

  constructor(@Inject(forwardRef(() => GameService)) private readonly gameService: GameService) {}

  createRoom(playerId: number, login: string): string {
    const id = this.generateRoomId();
    const newRoom: GameRoom = { id: id, players: [{ id: playerId, login }] };
    this.rooms.push(newRoom);
    this.broadcastRoomUpdates();
    return id;
  }

  joinRoom(roomId: string, playerId: number, login: string): GameRoom | null {
    const room = this.findRoom(roomId);
    if (room && room.players.length < 2) {
      room.players.push({ id: playerId, login });
      this.broadcastRoomUpdates();
      return room;
    }
    return null;
  }

  leaveRoom(playerId: number): void{
    this.removePlayerFromRooms(playerId);
  }

  getRoomInfo(roomId: string): GameRoom {
    return this.findRoom(roomId) || { id: roomId, players: [] };
  }

  getAllRooms(): GameRoom[] {
    return this.rooms.map(room => ({
      id: room.id,
      players: room.players,
      maxPlayers: 2,
    }));
  }

  findRoom(roomId: string): GameRoom | undefined {
    return this.rooms.find(room => room.id === roomId);
  }

  findRoomByPlayerId(playerId: number): GameRoom | undefined {
    return this.rooms.find(room => room.players.some(player => player.id === playerId));
  }

  isUserInRoom(roomId: string, playerId: number): boolean {
    return !!this.findRoom(roomId)?.players.some(player => player.id === playerId);
  }

  handlePlayerDisconnect(playerId: number) {
    this.removePlayerFromRooms(playerId);
  }

  removePlayerFromRooms(playerId: number) {
    this.rooms.forEach(room => {
      room.players = room.players.filter(player => player.id !== playerId);
    });
    this.cleanUpRooms();
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private broadcastRoomUpdates() {
    this.gameService['broadcastRoomsList']();
  }

  private cleanUpRooms() {
    this.rooms = this.rooms.filter(room => room.players.length > 0);
    this.broadcastRoomUpdates();
  }
}
