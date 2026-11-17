import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';

interface SongRecord {
    id: number;
    title: string;
    author: string;
    length: number;
    link: string;
}

@Injectable()
export class SongsService {
    constructor(private prisma: PrismaService) {}

    private mapSong(song: SongRecord) {
        return {
            id: song.id,
            title: song.title,
            author: song.author,
            duration: song.length,
            url: song.link,
        };
    }

    private async findSongOrThrow(id: number) {
        const song = await this.prisma.song.findUnique({ where: { id } });
        if (!song) throw new NotFoundException('Song not found');
        return song;
    }

    async getAllSongs() {
        const songs = await this.prisma.song.findMany();
        return songs.map((s) => this.mapSong(s));
    }

    async getSongById(id: number) {
        const song = await this.findSongOrThrow(id);
        return this.mapSong(song);
    }

    async createSong(dto: CreateSongDto) {
        const song = await this.prisma.song.create({
            data: {
                title: dto.title,
                author: dto.author,
                length: dto.duration,
                link: dto.url,
            },
        });
        return this.mapSong(song);
    }

    async updateSong(id: number, dto: UpdateSongDto) {
        await this.findSongOrThrow(id);

        const song = await this.prisma.song.update({
            where: { id },
            data: {
                ...(dto.title !== undefined ? { title: dto.title } : {}),
                ...(dto.author !== undefined ? { author: dto.author } : {}),
                ...(dto.duration !== undefined ? { length: dto.duration } : {}),
                ...(dto.url !== undefined ? { link: dto.url } : {}),
            },
        });
        return this.mapSong(song);
    }

    async deleteSong(id: number) {
        await this.findSongOrThrow(id);
        const deleted = await this.prisma.song.delete({ where: { id } });
        return this.mapSong(deleted);
    }
}
