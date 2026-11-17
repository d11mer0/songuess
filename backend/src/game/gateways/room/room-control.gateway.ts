import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from '@nestjs/websockets';
import { Injectable, Optional, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { wsCorsOptions } from '../../../common/config/cors.config';
import { RoomManagerService } from '../../services/room/room-manager.service';
import { RoomQueryService } from '../../services/room/room-query.service';
import { RoomHelperService } from '../../services/room/room-helper.service';
import { RoundManagerService } from '../../services/gameplay/round-manager.service';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';
import { GameRoomState } from '../../interfaces/game.interface';
import {
    KickMemberDto,
    RoomIdOptionalDto,
    StartGameDto,
    SwitchPartyModeDto,
} from '../../dto/room-actions.dto';

@WebSocketGateway({
    cors: wsCorsOptions,
})
@UsePipes(
    new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: (errors) => new WsException(errors),
    }),
)
@Injectable()
export class RoomControlGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly roomManagerService: RoomManagerService,
        private readonly roomQueryService: RoomQueryService,
        private readonly roomHelperService: RoomHelperService,
        @Optional()
        private readonly roundManagerService?: RoundManagerService,
    ) {}

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data?: RoomIdOptionalDto,
    ) {
        const user = client.data.user;
        if (!user) return;

        const room = (data?.id ? this.roomHelperService.findRoom(data.id) : undefined)
            || this.roomHelperService.findRoomByPlayerId(user.id);
        if (!room) return;

        const roomId = room.id;
        const shortCode = room.shortCode;

        this.roomManagerService.leaveRoom(user.id);
        client.leave(roomId);
        if (shortCode) {
            client.leave(shortCode);
        }

        const remainingRoom = this.roomHelperService.findRoom(roomId);
        const payload = remainingRoom
            ? sanitizeRoom(remainingRoom)
            : { id: roomId, players: [], leaderId: -1, state: GameRoomState.ADDING };

        this.server.to(roomId).emit('playerLeft', payload);
        if (shortCode) {
            this.server.to(shortCode).emit('playerLeft', payload);
        }
    }

    @SubscribeMessage('kickMember')
    handleKickMember(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: KickMemberDto,
    ) {
        const user = client.data.user;
        if (!user) return;

        const room = this.roomHelperService.findRoom(data.roomId);
        const roomId = room ? room.id : data.roomId;
        const shortCode = room?.shortCode;

        const kicked = this.roomManagerService.kickMember(
            user.id,
            roomId,
            data.memberId,
        );
        if (kicked) {
            const remainingRoom = this.roomHelperService.findRoom(roomId);
            const payload = remainingRoom
                ? sanitizeRoom(remainingRoom)
                : { id: roomId, players: [], leaderId: -1, state: GameRoomState.ADDING };

            this.server.to(roomId).emit('playerLeft', payload);
            if (shortCode) {
                this.server.to(shortCode).emit('playerLeft', payload);
            }

            for (const [, socket] of this.server.sockets.sockets) {
                if (socket.data?.user?.id === data.memberId) {
                    socket.leave(roomId);
                    if (shortCode) socket.leave(shortCode);
                }
            }
        }
    }

    @SubscribeMessage('startGame')
    handleStartGame(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: StartGameDto,
    ) {
        const user = client.data.user;
        if (!user) return;

        const foundRoom = this.roomHelperService.findRoom(data.id);
        const roomId = foundRoom ? foundRoom.id : data.id;

        const room = this.roomManagerService.startGame(roomId, user.id);
        if (room) {
            const safeRoom = sanitizeRoom(room);
            this.server.to(room.id).emit('gameStarted', safeRoom);
            if (room.shortCode) {
                this.server.to(room.shortCode).emit('gameStarted', safeRoom);
            }
            this.server.emit(
                'roomsList',
                this.roomQueryService.getAllJoinableRooms(
                    this.roomManagerService.allRooms,
                ),
            );
        }
    }

    @SubscribeMessage('getCurrentRoom')
    handleGetCurrentRoom(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        if (!user) return;

        const room = this.roomHelperService.findRoomByPlayerId(user.id);
        client.emit('currentRoom', room ? sanitizeRoom(room) : null);
    }

    @SubscribeMessage('getRooms')
    handleGetRooms(@ConnectedSocket() client: Socket) {
        const rooms = this.roomQueryService.getAllJoinableRooms(
            this.roomManagerService.allRooms,
        );
        client.emit('roomsList', rooms);
    }

    @SubscribeMessage('switchPartyMode')
    async handleSwitchPartyMode(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SwitchPartyModeDto,
    ) {
        const user = client.data.user;
        if (!user) return;

        const room = this.roomHelperService.findRoom(data.roomId);
        if (!room || room.leaderId !== user.id) return;

        if (!room.lobbyOptions) {
            room.lobbyOptions = {
                allowAutoJoin: true,
                publicLobby: true,
                maxPlayers: 8,
                isPartyMode: true,
            };
        }
        room.lobbyOptions.isPartyMode = Boolean(data.isPartyMode);

        let guestIds: number[] = [];
        if (!room.lobbyOptions.isPartyMode) {
            if (room.state === GameRoomState.ENDED || room.state === GameRoomState.STARTED) {
                this.roundManagerService?.cancelRoomGame(room.id);
                room.state = GameRoomState.ADDING;
                room.gameData = undefined;
                room.gameProgress = undefined;
                room.players = room.players.map((player) => ({ ...player, totalScore: 0 }));
            }

            const guestPlayers = room.players.filter((p) => Boolean(p.isGuest));
            guestIds = guestPlayers.map((g) => g.id);
            for (const guest of guestPlayers) {
                this.roomManagerService.leaveRoom(guest.id);
            }
        }

        await this.roomManagerService.syncRoom(room);

        const roomInfo = this.roomQueryService.getRoomInfo(
            room.id,
            this.roomManagerService.allRooms,
        );

        const partyPayload = {
            roomId: room.id,
            shortCode: room.shortCode,
            isPartyMode: room.lobbyOptions.isPartyMode,
            room: sanitizeRoom(roomInfo),
        };

        this.server.to(room.id).emit('partyModeSwitched', partyPayload);
        if (room.shortCode) {
            this.server.to(room.shortCode).emit('partyModeSwitched', partyPayload);
        }

        // Видаляємо сокети кікнутих гостей з Socket.IO-кімнати вже після доставки partyModeSwitched
        if (guestIds.length > 0 && this.server?.sockets?.sockets) {
            const guestSet = new Set(guestIds);
            for (const [, socket] of this.server.sockets.sockets) {
                if (socket.data?.user?.id && guestSet.has(socket.data.user.id)) {
                    socket.leave(room.id);
                    if (room.shortCode) socket.leave(room.shortCode);
                }
            }
        }
    }
}
