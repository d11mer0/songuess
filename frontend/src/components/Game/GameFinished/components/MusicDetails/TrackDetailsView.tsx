import React, { useState, useRef, useEffect } from 'react';
import styles from './MusicDetailsModal.module.css';
import { RoundTrackWithoutPreview } from '../../../../../types/gameEndedTypes';
import { useGetTrackByIdQuery, useSearchDeezerQuery } from '../../../../../store/api/deezerApi';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { getTrackStreamingLinks, getAlbumStreamingLinks } from '../../../../../utils/music/streamingLinks';
import { formatReleaseDate } from '../../../../../utils/music/dateFormatter';
import StreamingLinksGrid from './StreamingLinksGrid';
import { 
    FaPlay, 
    FaPause, 
    FaMusic, 
    FaUser, 
    FaCompactDisc, 
    FaClock, 
    FaHeartbeat, 
    FaFire, 
    FaBroadcastTower, 
    FaExternalLinkAlt, 
    FaLayerGroup,
    FaHeadphones,
    FaBackward,
    FaForward,
    FaRedo,
    FaVolumeUp,
    FaVolumeMute
} from 'react-icons/fa';
import { SiSpotify, SiApplemusic } from 'react-icons/si';
import { FaDeezer } from 'react-icons/fa6';

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
    const { t, language } = useTranslation();
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
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);
    const [isLooping, setIsLooping] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const title = deezerTrack?.title || track.title;
    const artistName = deezerTrack?.artist?.name || track.artistName || t('gameplay.singer');
    const artistId = deezerTrack?.artist?.id || track.artistId;
    const albumTitle = deezerTrack?.album?.title || track.albumName;
    const albumCover =
        deezerTrack?.album?.cover_xl ||
        deezerTrack?.album?.cover_big ||
        deezerTrack?.album?.cover_medium ||
        track.albumCover ||
        DEFAULT_COVER;
    const coverUrl = albumCover;
    const previewUrl = deezerTrack?.preview;
    const trackDuration = deezerTrack?.duration;
    const rawReleaseDate = deezerTrack?.release_date || deezerTrack?.album?.release_date;
    const formattedReleaseDate = formatReleaseDate(rawReleaseDate, language === 'uk' ? 'uk' : 'en');
    const bpm = deezerTrack?.bpm && deezerTrack.bpm > 0 ? Math.round(deezerTrack.bpm) : null;
    const isExplicit = Boolean(deezerTrack?.explicit_lyrics);
    const popularityRank = deezerTrack?.rank;
    const trackPosition = deezerTrack?.track_position;
    const diskNumber = deezerTrack?.disk_number;
    const hasRadio = Boolean(deezerTrack?.artist?.radio);
    const contributors = Array.isArray(deezerTrack?.contributors) ? deezerTrack.contributors : [];

    const streamingLinks = getTrackStreamingLinks(title, artistName, deezerTrack?.link);
    const albumLinks = albumTitle ? getAlbumStreamingLinks(albumTitle, artistName, deezerTrack?.album?.link) : null;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const onLoaded = () => setDuration(audio.duration || 30);
        const onEnded = () => {
            if (!isLooping) {
                setIsPlaying(false);
                setCurrentTime(0);
            }
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
    }, [previewUrl, isLooping]);

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

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const bar = progressBarRef.current;
        const audio = audioRef.current;
        if (!bar || !audio || duration <= 0) return;
        const rect = bar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newRatio = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = newRatio * duration;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleRewind5s = () => {
        if (!audioRef.current) return;
        const newTime = Math.max(0, audioRef.current.currentTime - 5);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleForward5s = () => {
        if (!audioRef.current) return;
        const newTime = Math.min(duration, audioRef.current.currentTime + 5);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleLoop = () => {
        if (!audioRef.current) return;
        const next = !isLooping;
        setIsLooping(next);
        audioRef.current.loop = next;
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        const next = !isMuted;
        setIsMuted(next);
        audioRef.current.muted = next;
    };

    // Calculate scale factor for GPU-accelerated progress animation (avoids layout reflow in Firefox)
    const progressScale = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

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

            {/* Upgraded Cyber Audio Preview Card */}
            {previewUrl && (
                <div className={`${styles.audioPreviewCard} ${isPlaying ? styles.audioPreviewPlaying : ''}`}>
                    <audio 
                        ref={audioRef} 
                        src={previewUrl} 
                        preload="none" 
                        loop={isLooping} 
                    />

                    {/* Top Row: Title Badge, Pulsing Dot & Time */}
                    <div className={styles.audioCardHeader}>
                        <div className={styles.audioBadge}>
                            <FaHeadphones style={{ color: '#00f3ff' }} />
                            <span>{t('gameplay.musicDetailsAudioPreviewTitle')}</span>
                            <span className={`${styles.liveDot} ${isPlaying ? styles.liveDotActive : ''}`} />
                        </div>
                        <div className={styles.audioTimeStatus}>
                            <span className={styles.timeCurrent}>{formatSeconds(currentTime)}</span>
                            <span className={styles.timeDivider}>/</span>
                            <span className={styles.timeDuration}>{formatSeconds(duration)}</span>
                        </div>
                    </div>

                    {/* Animated Sound Waveform Visualizer */}
                    <div className={styles.visualizerContainer}>
                        <div className={`${styles.visualizerWave} ${isPlaying ? styles.visualizerWavePlaying : ''}`}>
                            {Array.from({ length: 24 }).map((_, i) => (
                                <span
                                    key={i}
                                    className={styles.visualizerBar}
                                    style={{
                                        animationDelay: `${(i * 0.05) % 0.8}s`,
                                        height: isPlaying ? undefined : `${15 + (i % 6) * 10}%`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Seekable Progress Bar Scrubber */}
                    <div
                        ref={progressBarRef}
                        className={styles.progressBarTrack}
                        onClick={handleSeek}
                        title="Click to seek"
                    >
                        <div
                            className={styles.progressBarFill}
                            style={{ transform: `scaleX(${progressScale})` }}
                        />
                        <div
                            className={styles.progressBarThumb}
                            style={{ left: `${progressScale * 100}%` }}
                        />
                    </div>

                    {/* Controls Row */}
                    <div className={styles.audioControlsRow}>
                        <div className={styles.audioMainControls}>
                            <button
                                type="button"
                                className={styles.seekStepBtn}
                                onClick={handleRewind5s}
                                title={t('gameplay.musicDetailsRewind5s')}
                            >
                                <FaBackward style={{ fontSize: 10 }} />
                                <span>-5s</span>
                            </button>

                            <button
                                type="button"
                                className={`${styles.playBtn} ${isPlaying ? styles.playBtnActive : ''}`}
                                onClick={togglePlay}
                                title={isPlaying ? t('gameplay.musicDetailsPausePreview') : t('gameplay.musicDetailsPlayPreview')}
                            >
                                {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: 2 }} />}
                            </button>

                            <button
                                type="button"
                                className={styles.seekStepBtn}
                                onClick={handleForward5s}
                                title={t('gameplay.musicDetailsForward5s')}
                            >
                                <span>+5s</span>
                                <FaForward style={{ fontSize: 10 }} />
                            </button>
                        </div>

                        <div className={styles.audioExtraControls}>
                            <button
                                type="button"
                                className={`${styles.extraControlBtn} ${isLooping ? styles.extraControlActive : ''}`}
                                onClick={toggleLoop}
                                title={t('gameplay.musicDetailsLoop')}
                            >
                                <FaRedo style={{ fontSize: 11 }} />
                            </button>

                            <button
                                type="button"
                                className={`${styles.extraControlBtn} ${isMuted ? styles.extraControlMuted : ''}`}
                                onClick={toggleMute}
                                title={isMuted ? t('gameplay.musicDetailsUnmute') : t('gameplay.musicDetailsMute')}
                            >
                                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                            </button>
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

            {/* Dedicated Full Album Showcase Card */}
            {albumTitle && albumLinks && (
                <div className={styles.albumBannerCard}>
                    <div className={styles.albumBannerHeader}>
                        <div className={styles.albumBannerCover}>
                            <img
                                src={albumCover}
                                alt={albumTitle}
                                onError={(e) => {
                                    e.currentTarget.src = DEFAULT_COVER;
                                }}
                            />
                            <div className={styles.albumBannerVinyl} />
                        </div>
                        <div className={styles.albumBannerInfo}>
                            <span className={styles.albumBannerTag}>{t('gameplay.musicDetailsAlbum')}</span>
                            <h4 className={styles.albumBannerTitle} title={albumTitle}>
                                {albumTitle}
                            </h4>
                            <div className={styles.albumBannerSubRow}>
                                {trackPosition ? (
                                    <span className={styles.albumPositionChip}>
                                        <FaLayerGroup style={{ fontSize: 11 }} />
                                        <span>
                                            {t('gameplay.musicDetailsTrackIndex')} #{trackPosition}
                                            {diskNumber && diskNumber > 1 ? ` • ${t('gameplay.musicDetailsDisc')} ${diskNumber}` : ''}
                                        </span>
                                    </span>
                                ) : null}
                                {formattedReleaseDate && (
                                    <span className={styles.albumDateChip}>
                                        {formattedReleaseDate}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Direct Album Actions on Spotify, Deezer & Apple Music */}
                    <div className={styles.albumBannerActions}>
                        <a
                            href={albumLinks.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.albumActionBtnSpotify}
                            title={t('gameplay.musicDetailsOpenAlbumSpotify')}
                        >
                            <SiSpotify style={{ fontSize: 16 }} />
                            <span>{t('gameplay.musicDetailsOpenAlbumSpotify')}</span>
                            <FaExternalLinkAlt style={{ fontSize: 10, opacity: 0.6 }} />
                        </a>
                        <a
                            href={albumLinks.deezer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.albumActionBtnSecondary}
                            title={t('gameplay.musicDetailsOpenAlbumDeezer')}
                        >
                            <FaDeezer style={{ fontSize: 16, color: '#ef5466' }} />
                            <span>Deezer</span>
                        </a>
                        <a
                            href={albumLinks.apple}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.albumActionBtnSecondary}
                            title={t('gameplay.musicDetailsOpenAlbumApple')}
                        >
                            <SiApplemusic style={{ fontSize: 16, color: '#fc3c44' }} />
                            <span>Apple</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Enriched Metadata Grid */}
            <div className={styles.metadataGrid}>
                {trackDuration && (
                    <div className={styles.metaCard}>
                        <div className={styles.metaHeaderRow}>
                            <FaClock className={styles.metaIcon} style={{ color: '#00f3ff' }} />
                            <span className={styles.metaLabel}>{t('gameplay.musicDetailsDuration')}</span>
                        </div>
                        <span className={styles.metaValue}>{formatSeconds(trackDuration)}</span>
                    </div>
                )}
                {formattedReleaseDate && (
                    <div className={styles.metaCard}>
                        <div className={styles.metaHeaderRow}>
                            <FaCompactDisc className={styles.metaIcon} style={{ color: '#f15bb5' }} />
                            <span className={styles.metaLabel}>{t('gameplay.musicDetailsReleaseDate')}</span>
                        </div>
                        <span className={styles.metaValue}>{formattedReleaseDate}</span>
                    </div>
                )}
                {popularityRank !== undefined && popularityRank !== null && (
                    <div className={styles.metaCard}>
                        <div className={styles.metaHeaderRow}>
                            <FaFire className={styles.metaIcon} style={{ color: '#ffd700' }} />
                            <span className={styles.metaLabel}>{t('gameplay.musicDetailsPopularity')}</span>
                        </div>
                        <span className={styles.metaValue}>#{popularityRank.toLocaleString()}</span>
                    </div>
                )}
                {trackPosition && (
                    <div className={styles.metaCard}>
                        <div className={styles.metaHeaderRow}>
                            <FaLayerGroup className={styles.metaIcon} style={{ color: '#9b5de5' }} />
                            <span className={styles.metaLabel}>{t('gameplay.musicDetailsTrackNumber')}</span>
                        </div>
                        <span className={styles.metaValue}>
                            #{trackPosition} {diskNumber && diskNumber > 1 ? `(${t('gameplay.musicDetailsDisc')} ${diskNumber})` : ''}
                        </span>
                    </div>
                )}
                {bpm && (
                    <div className={styles.metaCard}>
                        <div className={styles.metaHeaderRow}>
                            <FaHeartbeat className={styles.metaIcon} style={{ color: '#ff4d6d' }} />
                            <span className={styles.metaLabel}>{t('gameplay.musicDetailsBpm')}</span>
                        </div>
                        <span className={styles.metaValue}>{bpm} BPM</span>
                    </div>
                )}
                {hasRadio && (
                    <div className={styles.metaCard}>
                        <div className={styles.metaHeaderRow}>
                            <FaBroadcastTower className={styles.metaIcon} style={{ color: '#00bbf9' }} />
                            <span className={styles.metaLabel}>{t('gameplay.musicDetailsRadioAvailable')}</span>
                        </div>
                        <span className={styles.metaValueChip}>✓ Live</span>
                    </div>
                )}
                <div className={styles.metaCard}>
                    <div className={styles.metaHeaderRow}>
                        <span className={styles.metaLabel}>{t('gameplay.musicDetailsExplicit')}</span>
                    </div>
                    {isExplicit ? (
                        <span className={styles.explicitBadge}>EXPLICIT 18+</span>
                    ) : (
                        <span className={styles.cleanBadge}>CLEAN</span>
                    )}
                </div>
            </div>

            {/* Contributors & Co-artists (if available) */}
            {contributors.length > 0 && (
                <div className={styles.contributorsSection}>
                    <div className={styles.sectionHeader}>
                        <FaUser style={{ color: '#f15bb5' }} />
                        <span>{t('gameplay.musicDetailsContributors')}</span>
                    </div>
                    <div className={styles.contributorsList}>
                        {contributors.map((contrib: any) => (
                            <button
                                key={contrib.id}
                                type="button"
                                className={styles.contributorChip}
                                onClick={() => onSelectArtist(contrib.name, contrib.id)}
                                title={t('gameplay.musicDetailsArtistTab')}
                            >
                                {contrib.picture_small && (
                                    <img
                                        src={contrib.picture_small}
                                        alt={contrib.name}
                                        className={styles.contributorAvatar}
                                    />
                                )}
                                <span className={styles.contributorName}>{contrib.name}</span>
                                {contrib.role && (
                                    <span className={styles.contributorRole}>{contrib.role}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
