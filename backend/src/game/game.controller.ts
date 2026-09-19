import { Controller, Get, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RoomManagerService } from './services/room/room-manager.service';
import { RoomHelperService } from './services/room/room-helper.service';

@ApiTags('game')
@Controller('game')
export class GameController {
    constructor(
        private readonly roomManagerService: RoomManagerService,
        private readonly roomHelperService: RoomHelperService,
    ) {}

    @Public()
    @Get('room/:code/check')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Перевірка існування та доступності кімнати за кодом або ID' })
    @ApiResponse({
        status: 200,
        description: 'Інформація про стан кімнати',
    })
    async checkRoom(@Param('code') code: string) {
        if (!code || !code.trim()) {
            return { exists: false, error: 'INVALID_CODE' };
        }

        const trimmed = code.trim();
        const room = await this.roomManagerService.getRoom(trimmed);
        if (!room) {
            return { exists: false, error: 'ROOM_NOT_FOUND' };
        }

        const onlinePlayers = room.players.filter((p) => p.isOnline);
        const hasOnline = onlinePlayers.length > 0;
        const hasGraceTimer = this.roomHelperService.hasActiveCleanupTimer(room.id);

        if (!hasOnline && !hasGraceTimer) {
            return { exists: false, error: 'ROOM_CLOSED' };
        }

        const maxPlayers = room.lobbyOptions?.maxPlayers || 8;
        const isFull = onlinePlayers.length >= maxPlayers;

        return {
            exists: true,
            roomId: room.id,
            shortCode: room.shortCode,
            state: room.state,
            isPartyMode: Boolean(room.lobbyOptions?.isPartyMode),
            isFull,
            playerCount: onlinePlayers.length,
            maxPlayers,
        };
    }
}
