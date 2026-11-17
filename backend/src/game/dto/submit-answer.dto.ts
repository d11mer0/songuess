import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SubmitAnswerDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    roomId: string;

    @IsInt()
    @Min(0)
    @Max(50)
    roundNumber: number;

    @IsString()
    @MaxLength(200)
    answer: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(30)
    snippetDurationUsed?: number;
}
