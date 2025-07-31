import { FC, useState } from 'react';
import { useSearchDeezerQuery } from '../../../../store/api/deezerApi';
import AlbumSearch from '../../../deezerFunctions/Album/AlbumSearch';
import AlbumOverview from '../../../deezerFunctions/Album/AlbumOverview';
import { SelectedTracks } from '../../../../types/gameTypes';
import ClearSelectionButton from './components/ClearSelectionButton';

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
        <div>
            <h2 style={{textAlign: 'center'}}>Type name of an album</h2>

            <AlbumSearch
                albumName={albumName}
                setAlbumName={setAlbumName}
                albumResults={albumResults?.data || []}
                onSelect={setSelectedAlbumId}
            />

            {selectedAlbumId && (
                <>
                    <AlbumOverview
                        albumId={selectedAlbumId}
                        onSendTracks={handleStart}
                        isList={false}
                    />
                    <ClearSelectionButton onClear={() => setSelectedAlbumId(null)} />
                </>
            )}
        </div>
    );
};

export default AlbumSelection;
