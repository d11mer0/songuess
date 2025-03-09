import { ApiProperty } from '@nestjs/swagger';

export class SongResponseDto {
  @ApiProperty({ example: 1, description: 'Унікальний ідентифікатор пісні' })
  id: number;

  @ApiProperty({ example: 'The Beatles', description: 'Автор пісні' })
  author: string;

  @ApiProperty({ example: 210, description: 'Тривалість пісні у секундах' })
  length: number;

  @ApiProperty({ example: 'https://example.com/song.mp3', description: 'Посилання на пісню' })
  link: string;
}