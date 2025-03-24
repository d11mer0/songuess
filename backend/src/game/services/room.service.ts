import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GameRoom, Player } from '../interfaces/game.interface';
import { GameService } from './game.service';

@Injectable()
export class RoomService {
  private rooms: GameRoom[] = [];

  constructor(@Inject(forwardRef(() => GameService)) private readonly gameService: GameService) {}

  createRoom(playerId: string, login: string): string {
    const roomId = Math.random().toString(36).substring(2, 9);
    const newRoom: GameRoom = { id: roomId, players: [{ id: playerId, login }] };
    this.rooms.push(newRoom);
    this.gameService['broadcastRoomsList']();
    return roomId;
  }

  joinRoom(roomId: string, playerId: string, login: string): boolean {
    const room = this.rooms.find(room => room.id === roomId);
    if (room && room.players.length < 2) {
      room.players.push({ id: playerId, login });
      this.gameService['broadcastRoomsList']();
      return true;
    }
    return false;
  }

  leaveRoom(roomId: string, playerId: string) {
    const room = this.rooms.find(room => room.id === roomId);
    if (room) {
      room.players = room.players.filter(p => p.id !== playerId);
      if (room.players.length === 0) {
        this.rooms = this.rooms.filter(r => r.id !== roomId);
      }
      this.gameService['broadcastRoomsList']();
    }
  }

  getRoomInfo(roomId: string): GameRoom {
    return this.rooms.find(room => room.id === roomId) || { id: roomId, players: [] };
  }

  getAllRooms(): GameRoom[] {
    return this.rooms.map(room => ({
      id: room.id,
      players: room.players,
      maxPlayers: 2,
    }));
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

  handlePlayerDisconnect(playerId: string) {
    this.rooms.forEach(room => {
      room.players = room.players.filter(player => player.id !== playerId);
    });
    this.rooms = this.rooms.filter(room => room.players.length > 0);
    this.gameService['broadcastRoomsList']();
  }

  removePlayerFromRooms(playerId: string) {
    this.rooms.forEach(room => {
      room.players = room.players.filter(player => player.id !== playerId);
    });
    this.rooms = this.rooms.filter(room => room.players.length > 0);
  }
}

/*

import { Injectable } from '@nestjs/common';
import { GameRoom, Player } from '../interfaces/game.interface';

@Injectable()
export class RoomService {
  private rooms: GameRoom[] = [];

  createRoom(playerId: string, login: string): string {
    const roomId = Math.random().toString(36).substring(2, 9);
    const newRoom: GameRoom = { id: roomId, players: [{ id: playerId, login }] };
    this.rooms.push(newRoom);
    return roomId;
  }

  joinRoom(roomId: string, playerId: string, login: string): boolean {
    const room = this.rooms.find(room => room.id === roomId);
    if (room && room.players.length < 2) {
      room.players.push({ id: playerId, login });
      return true;
    }
    return false;
  }

  leaveRoom(roomId: string, playerId: string) {
    const room = this.rooms.find(room => room.id === roomId);
    if (room) {
      room.players = room.players.filter(p => p.id !== playerId);
    }
  }

  getRoomInfo(roomId: string): GameRoom | undefined {
    return this.rooms.find(room => room.id === roomId);
  }

  getAllRooms(): GameRoom[] {
    return this.rooms.map(room => ({
      id: room.id,
      players: room.players,
      maxPlayers: 2,
    }));
  }

  getRoomByPlayerId(playerId: string): GameRoom | undefined {
    return this.rooms.find(room => room.players.some(player => player.id === playerId));
  }

  isUserInRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.find(room => room.id === roomId);
    return room ? room.players.some(player => player.id === playerId) : false;
  }

  removePlayerFromRooms(playerId: string) {
    this.rooms.forEach(room => {
      room.players = room.players.filter(player => player.id !== playerId);
    });
    this.rooms = this.rooms.filter(room => room.players.length > 0);
  }
}

*/