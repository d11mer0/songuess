import { Module, forwardRef } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { GameService } from './services/game.service';
import { UserModule } from '../users/user.module'; // Додаємо UserModule

import { TokenModule } from '../common/services/token/token.module';
import { GameplayService } from './services/gameplay.service';
import { GameplayGateway } from './gateways/gameplay.gateway';
import { RoomManagerService } from './services/room/room-manager.service';
import { RoomQueryService } from './services/room/room-query.service';
import { RoomHelperService } from './services/room/room-helper.service';
import { RoomControlGateway } from './gateways/room/room-control.gateway';
import { RoomLobbyGateway } from './gateways/room/room-lobby.gateway';

@Module({
    imports: [UserModule, TokenModule, forwardRef(() => GameModule)], // Додаємо UserModule і JwtModule
    providers: [
        GameGateway,
        RoomControlGateway,
        RoomLobbyGateway,
        GameplayGateway,
        GameService,
        RoomManagerService,
        RoomQueryService,
        RoomHelperService,
        GameplayService,

    ],
    exports: [
        GameService,
        RoomManagerService,
        RoomQueryService,
        RoomHelperService,
        GameplayService,
    ],
})
export class GameModule {}
