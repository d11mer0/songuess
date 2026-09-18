import { IsString, Length, Matches } from 'class-validator';

export class GuestAuthDto {
    @IsString()
    @Length(2, 20, { message: 'Nickname must be between 2 and 20 characters' })
    @Matches(/^[a-zA-Z0-9_а-яА-ЯіІїЇєЄ\s-]+$/, {
        message: 'Nickname can only contain letters, numbers, spaces, underscores and dashes',
    })
    nickname: string;
}
