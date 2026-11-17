import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class DailyGuessDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    guess: string;

    @IsNumber()
    @Min(1)
    @Max(6)
    attempt: number;
}
