import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpotifyModule } from '../spotify/spotify.module';
import { DeezerService } from './deezer.service';
import { DeezerController } from './deezer.controller';

@Module({
    imports: [HttpModule, SpotifyModule],
    controllers: [DeezerController],
    providers: [DeezerService],
    exports: [DeezerService],
})
export class DeezerModule {}
