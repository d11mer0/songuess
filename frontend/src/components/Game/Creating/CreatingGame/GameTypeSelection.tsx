import { FC } from 'react';
import { GameType } from '../../../../types/gameTypes';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from '../CreatingGame.module.css';

interface GameTypeSelectorProps {
    selectedGameType: GameType;
    onChange: (type: GameType) => void;
}

const GameTypeSelection: FC<GameTypeSelectorProps> = ({
    selectedGameType,
    onChange,
}) => {
    const { t } = useTranslation();

    return (
        <div className={styles.section}>
            <h2 className={styles.heading}>{t('gameCreation.selectGameType')}</h2>
            <div className={styles.gameTypeButtons}>
                <button
                    className={`${styles.typeButton} ${selectedGameType === 'THEME' ? styles.active : ''}`}
                    onClick={() => onChange('THEME')}
                >
                    {t('gameCreation.typeThemes')}
                </button>
                <button
                    className={`${styles.typeButton} ${selectedGameType === 'ARTIST' ? styles.active : ''}`}
                    onClick={() => onChange('ARTIST')}
                >
                    {t('gameCreation.typeArtist')}
                </button>
                <button
                    className={`${styles.typeButton} ${selectedGameType === 'PLAYLIST' ? styles.active : ''}`}
                    onClick={() => onChange('PLAYLIST')}
                >
                    {t('gameCreation.typePlaylist')}
                </button>
                <button
                    className={`${styles.typeButton} ${selectedGameType === 'ALBUM' ? styles.active : ''}`}
                    onClick={() => onChange('ALBUM')}
                >
                    {t('gameCreation.typeAlbum')}
                </button>
                <button
                    className={`${styles.typeButton} ${selectedGameType === 'URL' ? styles.active : ''}`}
                    onClick={() => onChange('URL')}
                >
                    {t('gameCreation.typeUrl')}
                </button>
            </div>
        </div>
    );
};

export default GameTypeSelection;