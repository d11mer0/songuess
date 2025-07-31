
import { FC } from 'react';
import { ArtistInfo, SelectedTracks } from '../../../../../types/gameTypes';
import { ArtistPlaylists } from '../../../..//deezerFunctions/Artist/ArtistPlaylists';
import ArtistTracks from '../../../../deezerFunctions/Artist/ArtistTracks';
import AlbumOverview from '../../../../deezerFunctions/Album/AlbumOverview';
import ArtistAlbums from '../../../../deezerFunctions/Artist/ArtistAlbums';

import styles from './SelectedArtistPanel.module.css';

type TracksFormat = 'ALL' | 'PLAYLIST' | 'ALBUM';

interface Props {
    artist: ArtistInfo;
    tracksFormat: TracksFormat;
    selectedAlbumId: number | null;
    onSelectAlbum: (id: number | null) => void;
    onSendTracks: (data: SelectedTracks) => void;
}

const SelectedArtistPanel: FC<Props> = ({
    artist, tracksFormat, selectedAlbumId, onSelectAlbum, onSendTracks
}) => {
    return (
        <>
            {tracksFormat === 'ALL' && (
                <ArtistTracks
                    artistId={artist.id}
                    isList={false}
                    onSendTracks={onSendTracks}
                />
            )}
            {tracksFormat === 'ALBUM' && (
                <>
                    <h3 className={styles.heading}>Select from which album you want select tracks</h3>
                    <div className={styles.albumLayout}>
                        <div className={styles.leftColumn}>
                            <ArtistAlbums
                                artistId={artist.id}
                                onSelectAlbum={onSelectAlbum}
                                selectedAlbumId={selectedAlbumId}
                            />
                        </div>

                        <div className={styles.rightColumn}>
                            {selectedAlbumId ? (
                                <AlbumOverview
                                    albumId={selectedAlbumId}
                                    onSendTracks={onSendTracks}
                                    hideAlbumInfo
                                    isList={false}
                                />
                            ) : (
                                <p className={styles.selectAlbumText}>
                                    Please select an album to view its tracks.
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
            {tracksFormat === 'PLAYLIST' && (
                <ArtistPlaylists
                    artistName={artist.name}
                    onSendTracks={onSendTracks}
                    isList={false}
                />
            )}
        </>
    );
};

export default SelectedArtistPanel;