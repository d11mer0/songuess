import { FC, useState } from 'react';
import { useLazyParsePlaylistUrlQuery } from '../../../../store/api/deezerApi';
import { SelectedTracks } from '../../../../types/gameTypes';
import PlaylistDetails from '../../../deezerFunctions/Playlist/PlaylistDetails';
import PlaylistTracks from '../../../deezerFunctions/Playlist/PlaylistTracks';
import StartGameButtonBlock from './components/StartGameButtonBlock';
import ClearSelectionButton from './components/ClearSelectionButton';
import OverviewLoadingPlaceholder from '../../../UI/Loader/OverviewLoading/OverviewLoadingPlaceholder';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './UrlPlaylistImport.module.css';

interface Props {
    handleStart: (payload: SelectedTracks) => void;
}

const UrlPlaylistImport: FC<Props> = ({ handleStart }) => {
    const { t } = useTranslation();
    const [url, setUrl] = useState('');
    const [triggerParse, { data: playlistDetails, isLoading, isFetching, error }] =
        useLazyParsePlaylistUrlQuery();

    const handleLoad = () => {
        if (!url.trim()) return;
        triggerParse(url.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLoad();
        }
    };

    const handleSendTracks = () => {
        if (!playlistDetails) return;

        handleStart({
            type: 'URL',
            playlist: {
                id: playlistDetails.id?.toString() || 'custom-url',
                title: playlistDetails.title || 'Playlist',
                picture: playlistDetails.picture_big,
            },
            tracks: playlistDetails.tracks?.data || [],
        });
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>{t('gameCreation.importUrlTitle')}</h2>
            <p className={styles.subHeading}>
                {t('gameCreation.importUrlSubtitle')}
            </p>

            <div className={styles.inputGroup}>
                <input
                    type="text"
                    className={styles.urlInput}
                    placeholder={t('gameCreation.importUrlPlaceholder')}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className={styles.loadButton}
                    onClick={handleLoad}
                    disabled={!url.trim() || isLoading || isFetching}
                >
                    {isLoading || isFetching ? t('gameCreation.importUrlLoadingBtn') : t('gameCreation.importUrlLoadBtn')}
                </button>
            </div>

            {error && (
                <div className={styles.errorMessage}>
                    {t('gameCreation.importUrlError')}
                </div>
            )}

            {(isLoading || isFetching) && (
                <OverviewLoadingPlaceholder loadingText={t('gameCreation.importUrlAnalyzing')} />
            )}

            {playlistDetails && !isFetching && (
                <>
                    <PlaylistDetails details={playlistDetails} />
                    <PlaylistTracks
                        tracks={playlistDetails.tracks?.data || []}
                        isLoading={isLoading}
                        isList={false}
                    />
                    <StartGameButtonBlock
                        trackCount={playlistDetails.tracks?.data?.length || 0}
                        onClick={handleSendTracks}
                    />
                    <ClearSelectionButton onClear={() => setUrl('')} />
                </>
            )}
        </div>
    );
};

export default UrlPlaylistImport;