import React from 'react';
import { Track } from '../TrackList';

interface TrackListFullProps {
    title: string;
    tracks: Track[];
}

const TrackListFull: React.FC<TrackListFullProps> = ({ title, tracks }) => {
    return (
        <div>
            <h3>{title}</h3>
            <ul>
                {tracks.map((track) => (
                    <li key={track.id}>
                        {track.title}
                        {track.artistName ? ` - ${track.artistName}` : ''}
                        {track.albumName ? ` (${track.albumName})` : ''}
                        <audio
                            controls
                            src={track.preview}
                            style={{ marginLeft: '10px' }}
                        >
                            Ваш браузер не підтримує аудіо.
                        </audio>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TrackListFull;
