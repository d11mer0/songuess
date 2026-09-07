import { Module } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { GameService } from './services/game/game.service';
import { UserModule } from '../users/user.module';

import { TokenModule } from '../common/services/token/token.module';
import { GameplayService } from './services/gameplay/gameplay.service';
import { GameplayGateway } from './gateways/gameplay.gateway';
import { RoomManagerService } from './services/room/room-manager.service';
import { RoomQueryService } from './services/room/room-query.service';
import { RoomHelperService } from './services/room/room-helper.service';
import { RoomControlGateway } from './gateways/room/room-control.gateway';
import { RoomLobbyGateway } from './gateways/room/room-lobby.gateway';
import { GameEventsService } from './services/gameplay/game-events.service';
import { GameResultService } from './services/gameplay/game-result.service';
import { RoundManagerService } from './services/gameplay/round-manager.service';
import { ScoringService } from './services/gameplay/scoring.service';
import { ConnectionService } from './services/game/connection.service';
import { ReconnectService } from './services/game/reconnect.service';
import { RoundSyncService } from './services/game/round-sync.service';

import { DeezerModule } from '../deezer/deezer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchmakingService } from './services/room/matchmaking.service';
import { RedisModule } from '../redis/redis.module';

import { AchievementModule } from '../achievements/achievement.module';

@Module({
    imports: [PrismaModule, UserModule, TokenModule, DeezerModule, RedisModule, AchievementModule],
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
        GameEventsService,
        GameResultService,
        RoundManagerService,
        ScoringService,
        ConnectionService,
        ReconnectService,
        RoundSyncService,
        MatchmakingService,
    ],
    exports: [
        GameService,
        RoomManagerService,
        RoomQueryService,
        RoomHelperService,
        GameplayService,
        MatchmakingService,
    ],
})
export class GameModule {}
