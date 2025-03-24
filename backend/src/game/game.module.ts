import { Module, forwardRef } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { RoomGateway } from './gateways/room.gateway';
import { GameService } from './services/game.service';
import { RoomService } from './services/room.service';
import { UserModule } from '../users/user.module'; // Додаємо UserModule

import { TokenModule } from '../common/services/token/token.module';

@Module({
  imports: [UserModule, TokenModule,  forwardRef(() => GameModule) ], // Додаємо UserModule і JwtModule
  providers: [GameGateway, RoomGateway, GameService, RoomService],
  exports: [GameService, RoomService] 
})
export class GameModule {}