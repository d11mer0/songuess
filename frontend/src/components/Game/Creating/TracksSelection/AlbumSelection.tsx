import { FC, useState } from 'react';
import { useSearchDeezerQuery } from '../../../../store/api/deezerApi';
import AlbumSearch from '../../../deezerFunctions/Album/AlbumSearch';
import AlbumOverview from '../../../deezerFunctions/Album/AlbumOverview';
import { SelectedTracks } from '../../../../types/gameTypes';
import ClearSelectionButton from './components/ClearSelectionButton';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './TrackSelection.module.css';

import { useDebounce } from '../../../../hooks/useDebounce';

interface Props {
    handleStart: (payload: SelectedTracks) => void;
    autoFocus?: boolean;
}

const AlbumSelection: FC<Props> = ({ handleStart, autoFocus = false }: Props) => {
    const { t } = useTranslation();
    const [albumName, setAlbumName] = useState('');
    const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);

    const debouncedAlbumName = useDebounce(albumName, 300);

    const { data: albumResults, isLoading: isSearching } = useSearchDeezerQuery(
        { query: debouncedAlbumName, type: 'album' },
        { skip: debouncedAlbumName.length < 3 },
    );

    return (
        <div>
            <h2 className={styles.sectionTitle}>{t('gameCreation.searchAlbumTitle')}</h2>

            <AlbumSearch
                albumName={albumName}
                setAlbumName={setAlbumName}
                albumResults={albumResults?.data || []}
                onSelect={setSelectedAlbumId}
                autoFocus={autoFocus}
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
