import React from 'react';
import styles from './Artist.module.css';
import { useTranslation } from '../../../i18n/LanguageContext';

interface ArtistProfileProps {
    artist: {
        id: number;
        name: string;
        picture_big?: string;
        picture_xl?: string;
        nb_album?: number;
        nb_fan?: number;
        link?: string;
    };
}

const ArtistDetails: React.FC<ArtistProfileProps> = ({ artist }) => {
    const { t } = useTranslation();
    return (
        <div className={styles.wrapper}>
            <h2 className={styles.name}>{artist.name}</h2>
            <img
                className={styles.avatar}
                src={artist.picture_xl || artist.picture_big || 'https://via.placeholder.com/150'}
                alt={artist.name}
            />
            <div className={styles.stats}>
                {artist.nb_album !== undefined && (
                    <p><strong>{artist.nb_album}</strong> {t('gameCreation.albumsLabel')}</p>
                )}
                {artist.nb_fan !== undefined && (
                    <p><strong>{(artist.nb_fan / 1000000).toFixed(1)}M</strong> {t('gameCreation.fansLabel')}</p>
                )}
            </div>
        </div>
    );
};

export default ArtistDetails;
