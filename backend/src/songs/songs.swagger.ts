import { ApiBody } from '@nestjs/swagger';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';

export const ApiCreateSong = ApiBody({
    description: 'Дані для створення нової пісні',
    type: CreateSongDto,
    examples: {
        example1: {
            summary: 'Приклад створення пісні',
            value: {
                title: 'Hey Jude',
                author: 'The Beatles',
                duration: 210,
                url: 'https://example.com/song.mp3',
            },
        },
    },
});

export const ApiUpdateSong = ApiBody({
    description: 'Дані для оновлення пісні (тільки змінені поля)',
    type: UpdateSongDto,
    examples: {
        example1: {
            summary: 'Приклад оновлення пісні',
            value: {
                author: 'Queen',
                duration: 240,
            },
        },
    },
});
