import { SelectedTracks } from '../interfaces/tracks.interface';

export interface LaunchGameDto {
    roomId: string;
    selectedTracks: SelectedTracks;
}