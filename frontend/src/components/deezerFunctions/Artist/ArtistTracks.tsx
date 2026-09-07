import { useEffect, useRef, useState } from 'react';
import { useGetAllTracksByArtistQuery } from '../../../store/api/deezerApi';
import { SelectedTracks, TrackItem } from '../../../types/gameTypes';
import StartGameButtonBlock from '../../Game/Creating/TracksSelection/components/StartGameButtonBlock';
import Loader from '../../UI/Loader/Loader/Loader';
import TrackList from '../Track/TrackList';
import { useTranslation } from '../../../i18n/LanguageContext';

interface ArtistTracksProps {
    artistId: number;
    onSendTracks?: (tracks: SelectedTracks) => void;
    isList?: boolean;
}

const ArtistTracks: React.FC<ArtistTracksProps> = ({
    artistId,
    onSendTracks,
    isList = true,
}) => {
    const { t } = useTranslation();
    const { data, error, isLoading, isFetching } = useGetAllTracksByArtistQuery(artistId);

    const tracks =
        data?.map((track: TrackItem) => ({
            id: track.id,
            title: track.title,
            preview: track.preview,
            album: {
                id: track.album?.id,
                title: track.album?.title,
                picture: track.album?.picture,
            },
        })) || [];

    if (isFetching || isLoading) {
        return <Loader text={t('gameCreation.tracksLoading')} />;
    }

    return (
        <>
            <TrackList
                title={t('gameCreation.formatAllTracks')}
                tracks={tracks}
                isLoading={isLoading}
                error={error}
                isList={isList}
            />
            {onSendTracks && (
                <StartGameButtonBlock
                    trackCount={tracks.length}
                    onClick={()=>{onSendTracks({ tracks: tracks })}}
                />
            )}
        </>
    );
};

export default ArtistTracks;

