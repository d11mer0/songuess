import {
    IsBoolean,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { AnswerMode, GameMode, LobbyOptions } from '../interfaces/game.interface';

export class CreateRoomDto implements LobbyOptions {
    @IsOptional()
    @IsBoolean()
    allowAutoJoin: boolean = false;

    @IsOptional()
    @IsBoolean()
    publicLobby: boolean = true;

    @IsOptional()
    @IsInt()
    @Min(2)
    @Max(20)
    maxPlayers: number = 4;

    @IsOptional()
    @IsIn(['CLASSIC', 'HEARDLE', 'DUEL'])
    gameMode?: GameMode;

    @IsOptional()
    @IsIn(['MULTIPLE_CHOICE', 'TYPE_IN'])
    answerMode?: AnswerMode;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(20)
    roundsCount?: number;

    @IsOptional()
    @IsInt()
    @Min(5)
    @Max(25)
    roundDuration?: number;

    @IsOptional()
    @IsBoolean()
    isPartyMode?: boolean;
}

export class JoinRoomDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    id: string;
}

export class JoinRoomByCodeDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(32)
    code: string;
}

export class RoomIdOptionalDto {
    @IsOptional()
    @IsString()
    @MaxLength(64)
    id?: string;
}

export class KickMemberDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    roomId: string;

    @IsInt()
    @Min(1)
    memberId: number;
}

export class StartGameDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    id: string;
}

export class SwitchPartyModeDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    roomId: string;

    @IsBoolean()
    isPartyMode: boolean;
}
