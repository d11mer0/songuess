import { FC, useState } from 'react';
import { useGetCuratedThemesQuery, useGetThemeTracksQuery } from '../../../../store/api/deezerApi';
import { SelectedTracks } from '../../../../types/gameTypes';
import PlaylistDetails from '../../../deezerFunctions/Playlist/PlaylistDetails';
import PlaylistTracks from '../../../deezerFunctions/Playlist/PlaylistTracks';
import StartGameButtonBlock from './components/StartGameButtonBlock';
import ClearSelectionButton from './components/ClearSelectionButton';
import OverviewLoadingPlaceholder from '../../../UI/Loader/OverviewLoading/OverviewLoadingPlaceholder';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './ThemesSelection.module.css';

interface Props {
    handleStart: (payload: SelectedTracks) => void;
}

const ThemesSelection: FC<Props> = ({ handleStart }) => {
    const { t } = useTranslation();
    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

    const { data: themes = [], isLoading: isLoadingThemes } = useGetCuratedThemesQuery();

    const {
        data: themeDetails,
        isLoading: isLoadingTracks,
        isFetching,
    } = useGetThemeTracksQuery(selectedThemeId!, {
        skip: !selectedThemeId,
    });

    const getThemeTitle = (theme: { id: string; title: string }) => {
        switch (theme.id) {
            case 'hits-2000s': return t('themes.hits2000sTitle');
            case 'legendary-80s': return t('themes.legendary80sTitle');
            case 'ukrainian-hits': return t('themes.ukrainianHitsTitle');
            case 'rock-ballads': return t('themes.rockBalladsTitle');
            case 'soundtracks-ost': return t('themes.soundtracksOstTitle');
            default: return theme.title;
        }
    };

    const getThemeDescription = (theme: { id: string; description: string }) => {
        switch (theme.id) {
            case 'hits-2000s': return t('themes.hits2000sDesc');
            case 'legendary-80s': return t('themes.legendary80sDesc');
            case 'ukrainian-hits': return t('themes.ukrainianHitsDesc');
            case 'rock-ballads': return t('themes.rockBalladsDesc');
            case 'soundtracks-ost': return t('themes.soundtracksOstDesc');
            default: return theme.description;
        }
    };

    const selectedTheme = themes.find((item: any) => item.id === selectedThemeId);

    const handleSendTracks = () => {
        if (!themeDetails) return;

        handleStart({
            type: 'THEME',
            playlist: {
                id: themeDetails.id?.toString() || 'theme',
                title: selectedTheme ? getThemeTitle(selectedTheme) : themeDetails.title,
                picture: themeDetails.picture_big,
            },
            tracks: themeDetails?.tracks?.data || [],
        });
    };

    if (isLoadingThemes) {
        return <OverviewLoadingPlaceholder loadingText={t('themes.loadingThemes')} />;
    }

    const localizedDetails = themeDetails && selectedTheme ? {
        ...themeDetails,
        title: getThemeTitle(selectedTheme),
        description: getThemeDescription(selectedTheme),
    } : themeDetails;

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>{t('themes.heading')}</h2>

            <div className={styles.themesGrid}>
                {themes.map((theme: any) => {
                    const isSelected = selectedThemeId === theme.id;
                    const localizedTitle = getThemeTitle(theme);
                    const localizedDesc = getThemeDescription(theme);

                    return (
                        <div
                            key={theme.id}
                            className={`${styles.themeCard} ${isSelected ? styles.selected : ''}`}
                            onClick={() => setSelectedThemeId(theme.id)}
                        >
                            <div className={styles.themeIcon}>{theme.icon}</div>
                            <div className={styles.themeTitle}>{localizedTitle}</div>
                            <div className={styles.themeDescription}>{localizedDesc}</div>
                            {isSelected && <span className={styles.selectedBadge}>{t('themes.selectedBadge')}</span>}
                        </div>
                    );
                })}
            </div>

            {(isLoadingTracks || isFetching) && (
                <OverviewLoadingPlaceholder loadingText={t('themes.loadingTracks')} />
            )}

            {selectedThemeId !== null && localizedDetails && !isFetching && (
                <>
                    <PlaylistDetails details={localizedDetails} />
                    <PlaylistTracks
                        tracks={themeDetails?.tracks?.data || []}
                        isLoading={isLoadingTracks}
                        isList={false}
                    />
                    <StartGameButtonBlock
                        trackCount={themeDetails?.tracks?.data?.length || 0}
                        onClick={handleSendTracks}
                    />
                    <ClearSelectionButton onClear={() => setSelectedThemeId(null)} />
                </>
            )}
        </div>
    );
};

export default ThemesSelection;