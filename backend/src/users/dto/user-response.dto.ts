// src/user/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    login: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ required: false })
    avatar?: string;

    @ApiProperty()
    record: number;

    @ApiProperty({ default: false })
    isPremium: boolean;

    @ApiProperty({ required: false })
    nameColor?: string;

    @ApiProperty({ required: false })
    customTitle?: string;
}
