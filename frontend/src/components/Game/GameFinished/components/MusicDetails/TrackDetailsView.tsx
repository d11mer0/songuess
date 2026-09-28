import React, { useState, useRef, useEffect } from 'react';
import styles from './MusicDetailsModal.module.css';
import { RoundTrackWithoutPreview } from '../../../../../types/gameEndedTypes';
import { useGetTrackByIdQuery, useSearchDeezerQuery } from '../../../../../store/api/deezerApi';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { getTrackStreamingLinks } from '../../../../../utils/music/streamingLinks';
import StreamingLinksGrid from './StreamingLinksGrid';
import { FaPlay, FaPause, FaMusic, FaUser, FaCompactDisc, FaClock, FaHeartbeat } from 'react-icons/fa';

interface TrackDetailsViewProps {
    track: RoundTrackWithoutPreview;
    onSelectArtist: (artistName: string, artistId?: number) => void;
}

const DEFAULT_COVER = 'https://e-cdns-images.dzcdn.net/images/cover/d41d8cd98f00b204e9800998ecf8427e/250x250-000000-80-0-0.jpg';

const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const TrackDetailsView: React.FC<TrackDetailsViewProps> = ({ track, onSelectArtist }) => {
    const { t } = useTranslation();
    const isNumericId = !isNaN(Number(track.id)) && Number(track.id) > 0;

    // Fetch by Deezer Track ID
    const {
        data: trackData,
        isLoading: isTrackLoading,
    } = useGetTrackByIdQuery(Number(track.id), {
        skip: !isNumericId,
    });

    // Fallback search if track.id was not numeric or track was not found
    const shouldSearch = !isNumericId && Boolean(track.title);
    const {
        data: searchData,
        isLoading: isSearchLoading,
    } = useSearchDeezerQuery(
        { query: `${track.title} ${track.artistName || ''}`.trim(), type: 'track' },
        { skip: !shouldSearch }
    );

    const deezerTrack = trackData || (searchData?.data && searchData.data[0]);
    const isLoading = (isNumericId && isTrackLoading) || (shouldSearch && isSearchLoading);

    // Audio preview state
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);

    const title = deezerTrack?.title || track.title;
    const artistName = deezerTrack?.artist?.name || track.artistName || t('gameplay.singer');
    const artistId = deezerTrack?.artist?.id || track.artistId;
    const albumTitle = deezerTrack?.album?.title || track.albumName;
    const coverUrl =
        deezerTrack?.album?.cover_xl ||
        deezerTrack?.album?.cover_big ||
        deezerTrack?.album?.cover_medium ||
        track.albumCover ||
        DEFAULT_COVER;
    const previewUrl = deezerTrack?.preview;
    const trackDuration = deezerTrack?.duration;
    const releaseDate = deezerTrack?.release_date || deezerTrack?.album?.release_date;
    const bpm = deezerTrack?.bpm && deezerTrack.bpm > 0 ? Math.round(deezerTrack.bpm) : null;
    const isExplicit = Boolean(deezerTrack?.explicit_lyrics);

    const streamingLinks = getTrackStreamingLinks(title, artistName, deezerTrack?.link);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const onLoaded = () => setDuration(audio.duration || 30);
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
            audio.pause();
        };
    }, [previewUrl]);

    const togglePlay = () => {
        if (!audioRef.current || !previewUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch((err) => {
                console.warn('Playback error:', err);
                setIsPlaying(false);
            });
        }
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={styles.modalBody}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.coverWrapper}>
                    <img
                        src={coverUrl}
                        alt={title}
                        className={styles.coverImage}
                        onError={(e) => {
                            e.currentTarget.src = DEFAULT_COVER;
                        }}
                    />
                </div>
                <div className={styles.heroMeta}>
                    <h3 className={styles.trackTitle}>{title}</h3>
                    <button
                        type="button"
                        className={styles.artistLinkBtn}
                        onClick={() => onSelectArtist(artistName, artistId)}
                        title={t('gameplay.musicDetailsArtistTab')}
                    >
                        <FaUser style={{ fontSize: 13, opacity: 0.8 }} />
                        <span>{artistName}</span>
                    </button>
                    {albumTitle && (
                        <p className={styles.albumSubtext}>
                            <FaCompactDisc style={{ marginRight: 6, opacity: 0.7 }} />
                            {albumTitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Audio Preview Card (if audio preview available) */}
            {previewUrl && (
                <div className={styles.audioPreviewCard}>
                    <audio ref={audioRef} src={previewUrl} preload="none" />
                    <button
                        type="button"
                        className={styles.playBtn}
                        onClick={togglePlay}
                        title={isPlaying ? t('gameplay.musicDetailsPausePreview') : t('gameplay.musicDetailsPlayPreview')}
                    >
                        {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: 2 }} />}
                    </button>
                    <div className={styles.audioTrackInfo}>
                        <div className={styles.audioLabelRow}>
                            <span>{t('gameplay.musicDetailsPlayPreview')} (30s)</span>
                            <span>{formatSeconds(currentTime)} / {formatSeconds(duration)}</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                            <div
                                className={styles.progressBarFill}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Loading state indicator if fetching details */}
            {isLoading && (
                <div className={styles.loadingPlaceholder}>
                    <div className={styles.spinner} />
                    <span>{t('gameplay.musicDetailsLoading')}</span>
                </div>
            )}

            {/* Metadata Grid */}
            <div className={styles.metadataGrid}>
                {trackDuration && (
                    <div className={styles.metaCard}>
                        <span className={styles.metaLabel}>{t('gameplay.musicDetailsDuration')}</span>
                        <span className={styles.metaValue}>{formatSeconds(trackDuration)}</span>
                    </div>
                )}
                {releaseDate && (
                    <div className={styles.metaCard}>
                        <span className={styles.metaLabel}>{t('gameplay.musicDetailsReleaseDate')}</span>
                        <span className={styles.metaValue}>{releaseDate}</span>
                    </div>
                )}
                {bpm && (
                    <div className={styles.metaCard}>
                        <span className={styles.metaLabel}>{t('gameplay.musicDetailsBpm')}</span>
                        <span className={styles.metaValue}>{bpm} BPM</span>
                    </div>
                )}
                {albumTitle && (
                    <div className={styles.metaCard}>
                        <span className={styles.metaLabel}>{t('gameplay.musicDetailsAlbum')}</span>
                        <span className={styles.metaValue}>{albumTitle}</span>
                    </div>
                )}
                {isExplicit && (
                    <div className={styles.metaCard}>
                        <span className={styles.metaLabel}>{t('gameplay.musicDetailsExplicit')}</span>
                        <span className={styles.explicitBadge}>EXPLICIT 18+</span>
                    </div>
                )}
            </div>

            {/* External Streaming Services */}
            <div className={styles.servicesSection}>
                <div className={styles.sectionHeader}>
                    <FaMusic style={{ color: '#00f3ff' }} />
                    <span>{t('gameplay.musicDetailsListenServices')}</span>
                </div>
                <StreamingLinksGrid links={streamingLinks} />
            </div>
        </div>
    );
};

export default TrackDetailsView;
