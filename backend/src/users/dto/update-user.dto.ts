import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'Логін є обов’язковим' })
    login: string;
}
