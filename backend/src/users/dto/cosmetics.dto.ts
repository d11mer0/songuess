import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateCosmeticsDto {
    @ApiProperty({ example: '#ffd700', required: false })
    @IsOptional()
    @IsString()
    @Matches(/^(#[0-9a-fA-F]{6})?$/, {
        message: 'Колір ніку має бути у HEX-форматі (наприклад, #ffd700)',
    })
    nameColor?: string;

    @ApiProperty({ example: '⭐ Музичний Експерт', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(32, { message: 'Титул не може бути довшим за 32 символи' })
    customTitle?: string;
}

export class PresetAvatarDto {
    @ApiProperty({ example: 'cyberpunk-dj' })
    @IsString()
    presetId: string;
}
