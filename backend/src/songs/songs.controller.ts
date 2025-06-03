import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongResponseDto } from './dto/song-response.dto';

import { Public } from '../common/decorators/public.decorator';

import { ApiCreateSong, ApiUpdateSong } from './songs.swagger';

@ApiTags('songs')
@Controller('songs')
export class SongsController {
    constructor(private readonly songService: SongsService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Отримати всі пісні' })
    @ApiResponse({
        status: 200,
        description: 'Список пісень',
        type: [SongResponseDto],
    })
    getAllSongs() {
        return this.songService.getAllSongs();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Отримати пісню за ID' })
    @ApiResponse({
        status: 200,
        description: 'Знайдена пісня',
        type: SongResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Пісня не знайдена' })
    getSongById(@Param('id') id: number) {
        return this.songService.getSongById(Number(id));
    }

    @Post()
    @ApiOperation({ summary: 'Створити нову пісню' })
    @ApiResponse({
        status: 201,
        description: 'Пісня успішно створена',
        type: SongResponseDto,
    })
    @ApiCreateSong
    createSong(@Body() dto: CreateSongDto) {
        return this.songService.createSong(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Оновити пісню' })
    @ApiResponse({
        status: 200,
        description: 'Пісня оновлена',
        type: SongResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Пісня не знайдена' })
    @ApiUpdateSong
    updateSong(@Param('id') id: number, @Body() dto: UpdateSongDto) {
        return this.songService.updateSong(Number(id), dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Видалити пісню' })
    @ApiResponse({ status: 200, description: 'Пісня видалена' })
    @ApiResponse({ status: 404, description: 'Пісня не знайдена' })
    deleteSong(@Param('id') id: number) {
        return this.songService.deleteSong(Number(id));
    }
}
