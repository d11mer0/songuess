import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';

@Injectable()
export class SongsService {
    constructor(private prisma: PrismaService) {}

    private async findSongOrThrow(id: number) {
        const song = await this.prisma.song.findUnique({ where: { id } });
        if (!song) throw new NotFoundException('Song not found');
        return song;
    }

    async getAllSongs() {
        return this.prisma.song.findMany();
    }

    async getSongById(id: number) {
        return this.findSongOrThrow(id);
    }

    async createSong(dto: CreateSongDto) {
        return this.prisma.song.create({ data: dto });
    }

    async updateSong(id: number, dto: UpdateSongDto) {
        await this.findSongOrThrow(id);

        return this.prisma.song.update({
            where: { id },
            data: dto,
        });
    }

    async deleteSong(id: number) {
        await this.findSongOrThrow(id);
        return this.prisma.song.delete({ where: { id } });
    }
}
