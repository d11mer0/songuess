import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCosmeticsDto {
    @ApiProperty({ example: '#ffd700', required: false })
    @IsOptional()
    @IsString()
    nameColor?: string;

    @ApiProperty({ example: '⭐ Музичний Експерт', required: false })
    @IsOptional()
    @IsString()
    customTitle?: string;
}

export class PresetAvatarDto {
    @ApiProperty({ example: 'cyberpunk-dj' })
    @IsString()
    presetId: string;
}