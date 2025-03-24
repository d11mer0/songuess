import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { RoomService } from './room.service';

@Injectable()
export class GameService {
  private server: Server | null = null;

  constructor(@Inject(forwardRef(() => RoomService)) private readonly roomService: RoomService) {}

  setServer(server: Server) {
    this.server = server;
  }

  leaveGame(playerId: string) {
    this.roomService.removePlayerFromRooms(playerId);
    this.broadcastRoomsList();
  }

  private broadcastRoomsList() {
    if (this.server) {
      this.server.emit('roomsList', this.roomService.getAllRooms());
    }
  }
}