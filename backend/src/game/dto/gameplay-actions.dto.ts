import { IsIn, IsInt, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class RestartGameDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    roomId: string;
}

export class UnlockHeardleDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    roomId: string;

    @IsInt()
    @Min(0)
    @Max(50)
    roundNumber: number;

    @IsNumber()
    @IsIn([1, 2, 5, 10, 20])
    snippetDuration: number;
}

export class SendReactionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    roomId: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(16)
    emoji: string;
}
