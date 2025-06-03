import { IsString, IsInt, Min } from 'class-validator';

export class CreateSongDto {
    @IsString()
    author: string;

    @IsInt()
    @Min(1)
    length: number;

    @IsString()
    link: string;
}
