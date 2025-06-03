// EditSongPage.tsx
import React from 'react';
import { useGetAllTracksByArtistQuery } from '../../store/api/deezerApi';

// 🔹 Описуємо тип трека
interface Track {
    id: number;
    title: string;
    album: {
        title: string;
    };
}

const EditSongPage: React.FC = () => {
    const artistId = 8470916; // Dua Lipa's Deezer artist ID
    const {
        data: tracks,
        error,
        isLoading,
    } = useGetAllTracksByArtistQuery(artistId, {
        skip: !artistId, // ✅ Запит не виконується, якщо немає artistId
    });

    if (isLoading) return <div>Loading tracks...</div>;
    if (error) return <div>Error loading tracks.</div>;

    return (
        <div>
            <h1>Tracks</h1>
            <ul>
                {tracks?.map((track: Track) => (
                    <li key={track.id}>
                        <strong>{track.title}</strong>{' '}
                        {track.album ? track.album.title : ''}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EditSongPage;

//MUST BE CLEAR AF
