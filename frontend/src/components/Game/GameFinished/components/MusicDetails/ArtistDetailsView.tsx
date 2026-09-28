import React, { useState, useEffect, useRef } from 'react';
import styles from './MusicDetailsModal.module.css';
import { 
    useGetArtistByIdQuery, 
    useSearchDeezerQuery, 
    useGetTopTracksByArtistQuery 
} from '../../../../../store/api/deezerApi';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { fetchArtistBio, ArtistBioResult } from '../../../../../utils/music/artistBio';
import { getArtistStreamingLinks } from '../../../../../utils/music/streamingLinks';
import StreamingLinksGrid from './StreamingLinksGrid';
import { 
    FaUser, 
    FaUsers, 
    FaCompactDisc, 
    FaWikipediaW, 
    FaPlay, 
    FaPause, 
    FaFire, 
    FaExternalLinkAlt,
    FaBroadcastTower,
    FaClock
} from 'react-icons/fa';

interface ArtistDetailsViewProps {
    artistName: string;
    artistId?: number;
}

const DEFAULT_ARTIST_AVATAR = 'https://e-cdns-images.dzcdn.net/images/artist/d41d8cd98f00b204e9800998ecf8427e/250x250-000000-80-0-0.jpg';

const formatFansCount = (fans: number) => {
    if (!fans || isNaN(fans)) return '0';
    if (fans >= 1_000_000) {
        return `${(fans / 1_000_000).toFixed(1)}M`;
    }
    if (fans >= 1_000) {
        return `${(fans / 1_000).toFixed(1)}K`;
    }
    return fans.toLocaleString();
};

const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const ArtistDetailsView: React.FC<ArtistDetailsViewProps> = ({ artistName, artistId: initialArtistId }) => {
    const { t, language } = useTranslation();

    // 1. Fetch by artistId if provided
    const isNumericId = Boolean(initialArtistId && !isNaN(Number(initialArtistId)));
    const {
        data: artistData,
        isLoading: isArtistLoading,
    } = useGetArtistByIdQuery(Number(initialArtistId), {
        skip: !isNumericId,
    });

    // Fallback artist search if ID not provided
    const shouldSearch = !isNumericId && Boolean(artistName);
    const {
        data: searchData,
        isLoading: isSearchLoading,
    } = useSearchDeezerQuery(
        { query: artistName, type: 'artist' },
        { skip: !shouldSearch }
    );

    const deezerArtist = artistData || (searchData?.data && searchData.data[0]);
    const effectiveId = initialArtistId || deezerArtist?.id;

    // 2. Fetch top tracks
    const {
        data: topTracksData,
    } = useGetTopTracksByArtistQuery(Number(effectiveId), {
        skip: !effectiveId,
    });

    // 3. Fetch Wikipedia biography
    const [bio, setBio] = useState<ArtistBioResult | null>(null);
    const [isBioLoading, setIsBioLoading] = useState(false);

    useEffect(() => {
        if (!artistName) return;
        let isMounted = true;
        setIsBioLoading(true);

        fetchArtistBio(artistName, language === 'uk' ? 'uk' : 'en')
            .then((result) => {
                if (isMounted) {
                    setBio(result);
                    setIsBioLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) setIsBioLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [artistName, language]);

    // Top tracks audio preview state
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);

    const handlePlayTopTrack = (trackId: number, previewUrl: string) => {
        if (!audioRef.current) return;

        if (playingTrackId === trackId) {
            audioRef.current.pause();
            setPlayingTrackId(null);
        } else {
            audioRef.current.src = previewUrl;
            audioRef.current.play().then(() => {
                setPlayingTrackId(trackId);
            }).catch((err) => {
                console.warn('Playback error:', err);
                setPlayingTrackId(null);
            });
        }
    };

    const handleAudioEnded = () => {
        setPlayingTrackId(null);
    };

    const displayName = deezerArtist?.name || artistName;
    const pictureUrl =
        deezerArtist?.picture_xl ||
        deezerArtist?.picture_big ||
        deezerArtist?.picture_medium ||
        bio?.thumbnail ||
        DEFAULT_ARTIST_AVATAR;
    const nbFans = deezerArtist?.nb_fan;
    const nbAlbums = deezerArtist?.nb_album;
    const hasRadio = Boolean(deezerArtist?.radio);

    const streamingLinks = getArtistStreamingLinks(displayName, deezerArtist?.link);
    const topTracks = Array.isArray(topTracksData)
        ? topTracksData.slice(0, 5)
        : topTracksData?.data
        ? topTracksData.data.slice(0, 5)
        : [];

    const isGlobalLoading = (isNumericId && isArtistLoading) || (shouldSearch && isSearchLoading);

    return (
        <div className={styles.modalBody}>
            {/* Hidden audio element for previewing top tracks */}
            <audio ref={audioRef} onEnded={handleAudioEnded} />

            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.artistAvatarWrapper}>
                    <img
                        src={pictureUrl}
                        alt={displayName}
                        className={styles.artistAvatar}
                        onError={(e) => {
                            e.currentTarget.src = DEFAULT_ARTIST_AVATAR;
                        }}
                    />
                </div>
                <div className={styles.heroMeta}>
                    <h3 className={styles.trackTitle}>{displayName}</h3>
                    <div className={styles.artistStatsRow}>
                        {nbFans !== undefined && (
                            <span 
                                className={styles.artistStatChip} 
                                title={`${nbFans.toLocaleString()} ${t('gameplay.musicDetailsArtistFans')}`}
                            >
                                <FaUsers style={{ color: '#00f3ff' }} />
                                <span>{formatFansCount(nbFans)} {t('gameplay.musicDetailsArtistFans')}</span>
                            </span>
                        )}
                        {nbAlbums !== undefined && (
                            <span className={styles.artistStatChip}>
                                <FaCompactDisc style={{ color: '#f15bb5' }} />
                                <span>{nbAlbums} {t('gameplay.musicDetailsArtistAlbums')}</span>
                            </span>
                        )}
                        {hasRadio && (
                            <span className={styles.artistStatChip}>
                                <FaBroadcastTower style={{ color: '#00bbf9' }} />
                                <span>{t('gameplay.musicDetailsRadioAvailable')}</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading state indicator */}
            {isGlobalLoading && (
                <div className={styles.loadingPlaceholder}>
                    <div className={styles.spinner} />
                    <span>{t('gameplay.musicDetailsLoading')}</span>
                </div>
            )}

            {/* Biography Section */}
            <div className={styles.artistBioBox}>
                <div className={styles.sectionHeader}>
                    <FaUser style={{ color: '#f15bb5' }} />
                    <span>{t('gameplay.musicDetailsArtistBio')}</span>
                </div>
                {isBioLoading ? (
                    <div className={styles.loadingPlaceholder} style={{ padding: '16px 0' }}>
                        <div className={styles.spinner} />
                        <span>{t('gameplay.musicDetailsLoading')}</span>
                    </div>
                ) : bio?.extract ? (
                    <>
                        <p className={styles.bioText}>{bio.extract}</p>
                        {bio.pageUrl && (
                            <a
                                href={bio.pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.wikiLink}
                            >
                                <FaWikipediaW />
                                <span>{t('gameplay.musicDetailsReadMoreWikipedia')}</span>
                                <FaExternalLinkAlt style={{ fontSize: 10 }} />
                            </a>
                        )}
                    </>
                ) : (
                    <p className={styles.bioText} style={{ opacity: 0.6 }}>
                        {t('gameplay.musicDetailsArtistNotFound')}
                    </p>
                )}
            </div>

            {/* Top Popular Tracks */}
            {topTracks.length > 0 && (
                <div className={styles.servicesSection}>
                    <div className={styles.sectionHeader}>
                        <FaFire style={{ color: '#ffd700' }} />
                        <span>{t('gameplay.musicDetailsTopTracks')}</span>
                    </div>
                    <ul className={styles.topTracksList}>
                        {topTracks.map((tr: any, idx: number) => {
                            const isPlaying = playingTrackId === tr.id;
                            const rankBadgeClass = 
                                idx === 0 ? styles.topTrackIndexGold :
                                idx === 1 ? styles.topTrackIndexSilver :
                                idx === 2 ? styles.topTrackIndexBronze : styles.topTrackIndex;

                            return (
                                <li key={tr.id || idx} className={styles.topTrackItem}>
                                    <span className={rankBadgeClass}>#{idx + 1}</span>
                                    <div className={styles.topTrackInfo}>
                                        <div className={styles.topTrackTitle} title={tr.title}>
                                            {tr.title}
                                        </div>
                                        <div className={styles.topTrackSub}>
                                            {tr.album?.title && (
                                                <span className={styles.topTrackAlbum}>{tr.album.title}</span>
                                            )}
                                            {tr.duration && (
                                                <span className={styles.topTrackDuration}>
                                                    <FaClock style={{ fontSize: 10, marginRight: 3, opacity: 0.7 }} />
                                                    {formatSeconds(tr.duration)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {tr.preview && (
                                        <button
                                            type="button"
                                            className={`${styles.miniPlayBtn} ${isPlaying ? styles.miniPlayBtnActive : ''}`}
                                            onClick={() => handlePlayTopTrack(tr.id, tr.preview)}
                                            title={isPlaying ? t('gameplay.musicDetailsPausePreview') : t('gameplay.musicDetailsPlayPreview')}
                                        >
                                            {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: 2 }} />}
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* External Streaming Services */}
            <div className={styles.servicesSection}>
                <div className={styles.sectionHeader}>
                    <FaCompactDisc style={{ color: '#00f3ff' }} />
                    <span>{t('gameplay.musicDetailsListenServices')}</span>
                </div>
                <StreamingLinksGrid links={streamingLinks} />
            </div>
        </div>
    );
};

export default ArtistDetailsView;
