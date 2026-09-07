import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class DailyGuessDto {
    @IsString()
    @IsNotEmpty()
    guess: string;

    @IsNumber()
    @Min(1)
    @Max(6)
    attempt: number;
}