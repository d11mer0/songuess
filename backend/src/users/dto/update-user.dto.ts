import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateUserDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty({ message: 'Логін є обов’язковим' })
    @Length(3, 20, { message: 'Логін має містити від 3 до 20 символів' })
    login: string;
}
