import { IsString, Length, Matches } from 'class-validator';

export class GuestAuthDto {
    @IsString()
    @Length(2, 20, { message: 'Nickname must be between 2 and 20 characters' })
    @Matches(/^[\p{L}\p{N}\s\-'.’_]+$/u, {
        message: 'Nickname contains invalid characters',
    })
    nickname: string;
}
