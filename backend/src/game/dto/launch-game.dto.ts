import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { SelectedTracks } from '../interfaces/tracks.interface';

export class LaunchGameDto {
    @IsString()
    @IsNotEmpty()
    roomId: string;

    @IsObject()
    selectedTracks: SelectedTracks;
}
