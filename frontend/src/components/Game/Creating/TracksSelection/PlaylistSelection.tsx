import { FC, useState } from 'react';
import { useGetPlaylistByIdQuery } from '../../../../store/api/deezerApi';
import PlaylistSearch from '../../../deezerFunctions/Playlist/PlaylistSearch';
import PlaylistTracks from '../../../deezerFunctions/Playlist/PlaylistTracks';
import PlaylistDetails from '../../../deezerFunctions/Playlist/PlaylistDetails';
import { SelectedTracks } from '../../../../types/gameTypes';

import ClearSelectionButton from './components/ClearSelectionButton';
import StartGameButtonBlock from './components/StartGameButtonBlock';
import OverviewLoadingPlaceholder from '../../../UI/Loader/OverviewLoading/OverviewLoadingPlaceholder';
import { useTranslation } from '../../../../i18n/LanguageContext';

interface Props {
    handleStart: (payload: SelectedTracks) => void;
}

const PlaylistSelection: FC<Props> = ({ handleStart }: Props) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(
        null,
    );

    const { data: playlistDetails, isLoading: isLoadingTracks, isFetching } =
        useGetPlaylistByIdQuery(selectedPlaylistId!, {
            skip: !selectedPlaylistId,
        });

    const handleSendTracks = () => {
        if (!playlistDetails) return;
         
        handleStart({
            type: 'PLAYLIST',
            playlist: {
                id: playlistDetails.id,
                title: playlistDetails.title,
                picture: playlistDetails.picture_big,
            },
            tracks: playlistDetails?.tracks?.data,
        });
    };

    return (
        <div>
            <h2 style={{textAlign: 'center'}}>{t('gameCreation.searchPlaylistTitle')}</h2>

            <PlaylistSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSelect={setSelectedPlaylistId}
            />
            {(isLoadingTracks || isFetching) && <OverviewLoadingPlaceholder loadingText={t('gameCreation.loadingPlaylistTracks')} />}
            {(selectedPlaylistId !== null && playlistDetails && !isFetching) && (
                <>
                    <PlaylistDetails details={playlistDetails} />
                    <PlaylistTracks
                        tracks={playlistDetails.tracks.data}
                        isLoading={isLoadingTracks}
                        isList={false}
                    />
                    <StartGameButtonBlock
                        trackCount={playlistDetails.tracks.data.length}
                        onClick={handleSendTracks}
                    />
                    <ClearSelectionButton onClear={() => setSelectedPlaylistId(null)} />

                </>
            )}
        </div>
    );
};

export default PlaylistSelection;
