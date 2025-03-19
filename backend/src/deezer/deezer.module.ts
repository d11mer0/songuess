import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DeezerService } from './deezer.service';
import { DeezerController } from './deezer.controller';

@Module({
  imports: [HttpModule],
  controllers: [DeezerController],
  providers: [DeezerService],
})
export class DeezerModule {}
