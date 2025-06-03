import { FC, useState } from 'react';
import { useSearchDeezerQuery } from '../../../../store/api/deezerApi';
import AlbumSearch from '../../../deezerFunctions/Album/AlbumSearch';

import AlbumOverview from '../../../deezerFunctions/Album/AlbumOverview';
import { SelectedTracks } from '../../../../types/gameTypes';

interface Props {
    handleStart: (payload: SelectedTracks) => void;
}

const AlbumSelection: FC<Props> = ({ handleStart }: Props) => {
    const [albumName, setAlbumName] = useState('');
    const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);

    const { data: albumResults, isLoading: isSearching } = useSearchDeezerQuery(
        { query: albumName, type: 'album' },
        { skip: albumName.length < 3 },
    );

    return (
        <div className="album-page">
            <h2>Find an Album</h2>

            {/* 🔹 Пошук альбому */}
            <AlbumSearch
                albumName={albumName}
                setAlbumName={setAlbumName}
                albumResults={albumResults?.data || []}
                onSelect={setSelectedAlbumId}
            />

            {/* 🔹 Деталі альбому + треки */}
            {selectedAlbumId && (
                <AlbumOverview
                    albumId={selectedAlbumId}
                    onSendTracks={handleStart}
                    isList={false}
                />
            )}
        </div>
    );
};

export default AlbumSelection;
