import { useState, FC } from 'react';
import ArtistSearch from '../../../deezerFunctions/Artist/ArtistSearch';
import ArtistDetails from '../../../deezerFunctions/Artist/ArtistDetails';
import { ArtistInfo, SelectedTracks } from '../../../../types/gameTypes';
import ClearSelectionButton from './components/ClearSelectionButton';
import TrackTypeSelector from './ArtistSelection/TrackTypeSelector';
import SelectedArtistPanel from './ArtistSelection/SelectedArtistPanel';

type TracksFormat = 'ALL' | 'PLAYLIST' | 'ALBUM';

interface Props {
    handleStart: (payload: SelectedTracks) => void;
}

const ArtistSelection: FC<Props> = ({ handleStart }) => { 
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArtist, setSelectedArtist] = useState<ArtistInfo | null>(
        null,
    );
    const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
    const [tracksFormat, setTracksFormat] = useState<TracksFormat>('ALBUM');

    const handleSendTracks = (data: SelectedTracks) => {
        if (selectedArtist) {
            handleStart({
                ...data,
                type: 'ARTIST',
                artist: {
                    id: selectedArtist.id,
                    name: selectedArtist.name,
                    picture: selectedArtist.picture_big,
                },
            });
        } else {
            console.log('selectedArtist not selected');
        }
    };

    const handleSelectArtist = (artist: ArtistInfo) => {
        setSelectedArtist(artist);
        setSelectedAlbumId(null);
    };

    return (
        <div>
            <h2 style={{textAlign: 'center'}}>Search for an artist</h2>

            <ArtistSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelect={handleSelectArtist}
            />

            {selectedArtist && (
                <>          
                    <ArtistDetails artist={selectedArtist} />        
                    <TrackTypeSelector
                        selected={tracksFormat}
                        onChange={setTracksFormat}
                    />
                    <SelectedArtistPanel
                        artist={selectedArtist}
                        tracksFormat={tracksFormat}
                        selectedAlbumId={selectedAlbumId}
                        onSelectAlbum={setSelectedAlbumId}
                        onSendTracks={handleSendTracks}
                    />
                    <ClearSelectionButton onClear={() => setSelectedArtist(null)} />
                </>
            )}
        </div>
    );
};

export default ArtistSelection;