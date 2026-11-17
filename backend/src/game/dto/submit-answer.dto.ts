import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitAnswerDto {
    @IsString()
    @IsNotEmpty()
    roomId: string;

    @IsInt()
    @Min(0)
    @Max(50)
    roundNumber: number;

    @IsString()
    answer: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(30)
    snippetDurationUsed?: number;
}
