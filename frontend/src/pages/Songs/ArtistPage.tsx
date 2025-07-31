import { useState } from 'react';
import ArtistSearch from '../../components/deezerFunctions/Artist/ArtistSearch';
import ArtistDetails from '../../components/deezerFunctions/Artist/ArtistDetails';
import { ArtistPlaylists } from '../../components/deezerFunctions/Artist/ArtistPlaylists';
import ArtistTracks from '../../components/deezerFunctions/Artist/ArtistTracks';
import AlbumOverview from '../../components/deezerFunctions/Album/AlbumOverview';
import ArtistAlbums from '../../components/deezerFunctions/Artist/ArtistAlbums';
import { ArtistInfo } from '../../types/gameTypes';

const ArtistPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArtist, setSelectedArtist] = useState<ArtistInfo  | null>(null);
    const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);

    const handleSelectArtist = (artist: ArtistInfo ) => {
        setSelectedArtist(artist);
        setSelectedAlbumId(null);
    };

    return (
        <div>
            <h1>Пошук виконавця у Deezer</h1>
            <ArtistSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelect={handleSelectArtist}
            />

            {selectedArtist && (
                <>
                    {/* ✅ Перший запит */}
                    <ArtistDetails artist={selectedArtist} />
                    <ArtistAlbums
                        artistId={selectedArtist.id}
                        onSelectAlbum={setSelectedAlbumId}
                    />
                    {selectedAlbumId && (
                        <AlbumOverview
                            albumId={selectedAlbumId}
                            hideAlbumInfo
                        />
                    )}
                    <ArtistPlaylists artistName={selectedArtist.name} />
                    <ArtistTracks artistId={selectedArtist.id} />
                </>
            )}
        </div>
    );
};

export default ArtistPage;
