import { Injectable, Inject, forwardRef, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { TokenService } from '../../common/services/token/token.service';
import { UserService } from '../../users/user.service';

@Injectable()
export class GameService {
  private server: Server | null = null;
  private clients = new Map<string, number>();

  constructor(
    @Inject(forwardRef(() => RoomService)) private readonly roomService: RoomService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  authenticateClient(client: Socket): number {
    const token = client.handshake.auth.token;
    if (!token) throw new Error('No token provided');

    const user = this.tokenService.verifyAccessToken(token);
    if (!user) throw new Error('Invalid token');

    client.data.user = user;
    this.clients.set(client.id, user.id);
    return user.id;
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    const room = this.roomService.findRoomByPlayerId(user.id);
    if (room) {
      this.server?.to(room.id).emit('playerLeft', { playerId: user.id, login: user.login });
    }

    this.leaveGame(user.id);
    this.clients.delete(client.id);
  }

  async reconnectRoom(client: Socket, roomId: string) {
    if (!client.data.user) {
      const userId = this.clients.get(client.id);
      if (!userId) throw new UnauthorizedException('No user with this id');

      const user = await this.userService.getUserById(userId);
      if (!user) throw new UnauthorizedException('No user with this id');

      client.data.user = { id: user.id, login: user.login };
    }

    const room = this.roomService.findRoom(roomId);
    if (!room) return;

    if (!room.players.some(p => p.id === client.data.user.id)) {
      room.players.push({ id: client.data.user.id, login: client.data.user.login });
    }

    client.join(room.id);
    this.server?.to(room.id).emit('joinedRoom', { id: room.id, players: room.players });
  }

  leaveGame(playerId: number) {
    this.roomService.removePlayerFromRooms(playerId);
    this.broadcastRoomsList();
  }

  private broadcastRoomsList() {
    this.server?.emit('roomsList', this.roomService.getAllRooms());
  }
}