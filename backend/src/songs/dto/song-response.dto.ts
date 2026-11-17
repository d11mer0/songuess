import { ApiProperty } from '@nestjs/swagger';

export class SongResponseDto {
    @ApiProperty({ example: 1, description: 'Унікальний ідентифікатор пісні' })
    id: number;

    @ApiProperty({ example: 'Hey Jude', description: 'Назва пісні' })
    title: string;

    @ApiProperty({ example: 'The Beatles', description: 'Автор пісні' })
    author: string;

    @ApiProperty({ example: 210, description: 'Тривалість пісні у секундах' })
    duration: number;

    @ApiProperty({
        example: 'https://example.com/song.mp3',
        description: 'Посилання на пісню',
    })
    url: string;
}
