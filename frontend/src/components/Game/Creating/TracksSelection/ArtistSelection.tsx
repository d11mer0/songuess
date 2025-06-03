import { useMemo, useState, FC } from 'react';
import ArtistSearch from '../../../deezerFunctions/Artist/ArtistSearch';
import ArtistDetails from '../../../deezerFunctions/Artist/ArtistDetails';
import { ArtistPlaylists } from '../../..//deezerFunctions/Artist/ArtistPlaylists';
import ArtistTracks from '../../../deezerFunctions/Artist/ArtistTracks';
import AlbumOverview from '../../../deezerFunctions/Album/AlbumOverview';
import ArtistAlbums from '../../../deezerFunctions/Artist/ArtistAlbums';
import { ArtistInfo, SelectedTracks } from '../../../../types/gameTypes';

type TracksFormat = 'ALL' | 'PLAYLIST' | 'ALBUM';

interface Props {
    handleStart: (payload: SelectedTracks) => void;
}

const ArtistSelection: FC<Props> = ({ handleStart }: Props) => {
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
            <ArtistSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelect={handleSelectArtist}
            />

            {selectedArtist && (
                <>
                    <div>
                        <h1>select type of tracks</h1>
                        <button
                            onClick={() => {
                                setTracksFormat('ALL');
                            }}
                        >
                            All
                        </button>
                        <button
                            onClick={() => {
                                setTracksFormat('PLAYLIST');
                            }}
                        >
                            Playlist
                        </button>
                        <button
                            onClick={() => {
                                setTracksFormat('ALBUM');
                            }}
                        >
                            Album
                        </button>
                    </div>
                    <div>
                        <ArtistDetails artist={selectedArtist} />
                        {tracksFormat === 'ALL' && (
                            <ArtistTracks
                                artistId={selectedArtist.id}
                                isList={false}
                                onSendTracks={handleSendTracks}
                            />
                        )}
                        {tracksFormat === 'ALBUM' && (
                            <>
                                <ArtistAlbums
                                    artistId={selectedArtist.id}
                                    onSelectAlbum={setSelectedAlbumId}
                                />
                                {selectedAlbumId && (
                                    <AlbumOverview
                                        albumId={selectedAlbumId}
                                        onSendTracks={handleSendTracks}
                                        hideAlbumInfo
                                        isList={false}
                                    />
                                )}
                            </>
                        )}
                        {tracksFormat === 'PLAYLIST' && (
                            <ArtistPlaylists
                                artistName={selectedArtist.name}
                                onSendTracks={handleSendTracks}
                                isList={false}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ArtistSelection;