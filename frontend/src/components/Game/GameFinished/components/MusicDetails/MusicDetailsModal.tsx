import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './MusicDetailsModal.module.css';
import { RoundTrackWithoutPreview } from '../../../../../types/gameEndedTypes';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import TrackDetailsView from './TrackDetailsView';
import ArtistDetailsView from './ArtistDetailsView';
import { FaMusic, FaUser, FaTimes } from 'react-icons/fa';

interface MusicDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    track: RoundTrackWithoutPreview | null;
    initialTab?: 'track' | 'artist';
    targetArtist?: { name: string; id?: number } | null;
}

const MusicDetailsModal: React.FC<MusicDetailsModalProps> = ({
    isOpen,
    onClose,
    track,
    initialTab = 'track',
    targetArtist,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'track' | 'artist'>(initialTab);
    const [selectedArtist, setSelectedArtist] = useState<{ name: string; id?: number } | null>(
        targetArtist || null
    );

    // Sync tab when modal opens or initialTab changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            if (targetArtist) {
                setSelectedArtist(targetArtist);
            } else if (track) {
                setSelectedArtist({
                    name: track.artistName || '',
                    id: track.artistId,
                });
            }
        }
    }, [isOpen, initialTab, targetArtist, track]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen || (!track && !selectedArtist)) {
        return null;
    }

    const handleSelectArtist = (artistName: string, artistId?: number) => {
        setSelectedArtist({ name: artistName, id: artistId });
        setActiveTab('artist');
    };

    const artistName = selectedArtist?.name || track?.artistName || '';
    const artistId = selectedArtist?.id || track?.artistId;

    return createPortal(
        <div
            className={styles.modalOverlay}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className={styles.modalContent}>
                {/* Header with Switcher Tabs */}
                <div className={styles.modalHeader}>
                    <div className={styles.tabGroup}>
                        {track && (
                            <button
                                type="button"
                                className={`${styles.tabBtn} ${activeTab === 'track' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('track')}
                            >
                                <FaMusic />
                                <span>{t('gameplay.musicDetailsTrackTab')}</span>
                            </button>
                        )}
                        {artistName && (
                            <button
                                type="button"
                                className={`${styles.tabBtn} ${activeTab === 'artist' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('artist')}
                            >
                                <FaUser />
                                <span>{t('gameplay.musicDetailsArtistTab')}</span>
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        title={t('gameplay.musicDetailsClose')}
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Tab Views */}
                {activeTab === 'track' && track ? (
                    <TrackDetailsView
                        track={track}
                        onSelectArtist={handleSelectArtist}
                    />
                ) : (
                    <ArtistDetailsView
                        artistName={artistName}
                        artistId={artistId}
                        onSelectArtist={handleSelectArtist}
                    />
                )}
            </div>
        </div>,
        document.body
    );
};

export default MusicDetailsModal;
