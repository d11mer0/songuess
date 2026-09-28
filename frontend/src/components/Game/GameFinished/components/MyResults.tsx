import React, { useState } from 'react';
import { FaChartLine, FaInfoCircle, FaMusic, FaUser } from 'react-icons/fa';
import { useTranslation } from '../../../../i18n/LanguageContext';
import { RoundTrackWithoutPreview } from '../../../../types/gameEndedTypes';
import styles from '../GameFinished.module.css';
import MusicDetailsModal from './MusicDetails/MusicDetailsModal';

interface Result {
    roundNumber: number;
    track: RoundTrackWithoutPreview;
    isCorrect: boolean;
}

interface MyResultsProps {
    results: Result[];
}

const MyResults: React.FC<MyResultsProps> = ({ results }) => {
    const { t } = useTranslation();
    const [selectedTrack, setSelectedTrack] = useState<RoundTrackWithoutPreview | null>(null);
    const [modalInitialTab, setModalInitialTab] = useState<'track' | 'artist'>('track');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenTrackModal = (track: RoundTrackWithoutPreview) => {
        setSelectedTrack(track);
        setModalInitialTab('track');
        setIsModalOpen(true);
    };

    const handleOpenArtistModal = (track: RoundTrackWithoutPreview) => {
        setSelectedTrack(track);
        setModalInitialTab('artist');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTrack(null);
    };

    return (
        <>
            <section className={styles.gameFinishedSection}>
                <h3 className={styles.sectionTitle}>
                    <FaChartLine className={styles.sectionIcon} /> {t('gameplay.yourPerformance')}
                </h3>
                <ul className={styles.resultsList}>
                    {results.map((res, i) => (
                        <li key={i} className={styles.resultItem}>
                            <span className={styles.roundNumber}>#{res.roundNumber + 1}</span>
                            <div className={styles.trackBlock}>
                                <button
                                    type="button"
                                    className={styles.trackTitleBtn}
                                    onClick={() => handleOpenTrackModal(res.track)}
                                    title={`${t('gameplay.musicDetailsTrackTab')}: ${res.track.title}`}
                                >
                                    <FaMusic style={{ fontSize: 12, opacity: 0.7 }} />
                                    <span>{res.track.title}</span>
                                </button>
                                <button
                                    type="button"
                                    className={styles.trackArtistBtn}
                                    onClick={() => handleOpenArtistModal(res.track)}
                                    title={`${t('gameplay.musicDetailsArtistTab')}: ${res.track.artistName || ''}`}
                                >
                                    <FaUser style={{ fontSize: 11, opacity: 0.7 }} />
                                    <span>{res.track.artistName || t('gameplay.singer')}</span>
                                </button>
                            </div>
                            <div className={styles.resultRightActions}>
                                <button
                                    type="button"
                                    className={styles.infoActionBtn}
                                    onClick={() => handleOpenTrackModal(res.track)}
                                    title={t('gameplay.musicDetailsClickForDetails')}
                                >
                                    <FaInfoCircle />
                                </button>
                                <span className={`${styles.resultMark} ${res.isCorrect ? styles.correct : styles.incorrect}`}>
                                    {res.isCorrect ? '✅' : '❌'}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Music & Artist Details Modal */}
            <MusicDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                track={selectedTrack}
                initialTab={modalInitialTab}
            />
        </>
    );
};

export default MyResults;
