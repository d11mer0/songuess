import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useGetSongsQuery, useDeleteSongMutation } from '../../store/api/songsApi';
import { useTranslation } from '../../i18n/LanguageContext';
import styles from './AllSongsPage.module.css';
import { FaPlay, FaPause, FaTrash, FaMusic, FaPlus, FaSearch } from 'react-icons/fa';
import Loader from '../../components/UI/Loader/Loader/Loader';

const AllSongsPage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useSelector((state: RootState) => state.user);
    const { data: songs, isLoading, refetch } = useGetSongsQuery();
    const [deleteSong] = useDeleteSongMutation();

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0:30';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleTogglePlay = (songId: string, audioUrl: string) => {
        if (!audioUrl) return;

        if (currentPlayingId === songId) {
            audioRef.current?.pause();
            setCurrentPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => setCurrentPlayingId(null));
                setCurrentPlayingId(songId);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t('songsPage.deleteConfirm'))) {
            try {
                await deleteSong(id).unwrap();
                refetch();
            } catch (err) {
                console.error('Failed to delete song', err);
            }
        }
    };

    const filteredSongs = (songs || []).filter((song) => {
        const q = searchQuery.toLowerCase();
        return (
            (song.title && song.title.toLowerCase().includes(q)) ||
            (song.author && song.author.toLowerCase().includes(q))
        );
    });

    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className={styles.container}>
            <audio
                ref={audioRef}
                onEnded={() => setCurrentPlayingId(null)}
                onError={() => setCurrentPlayingId(null)}
            />

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('songsPage.title')}</h1>
                    <p className={styles.subtitle}>{t('songsPage.subtitle')}</p>
                </div>
                {isAuthenticated && (
                    <Link to="/songs/create" className={styles.createBtn}>
                        <FaPlus /> {t('songsPage.createBtn')}
                    </Link>
                )}
            </div>

            <div className={styles.quickNavRow}>
                <Link to="/songs/track" className={styles.quickNavLink}>
                    <FaSearch style={{ marginRight: '5px' }} /> Deezer: {t('gameplay.guessTrack')}
                </Link>
                <Link to="/songs/artist" className={styles.quickNavLink}>
                    <FaMusic style={{ marginRight: '5px' }} /> Deezer: {t('songsPage.searchArtist')}
                </Link>
                <Link to="/songs/playlist" className={styles.quickNavLink}>
                    Deezer: {t('songsPage.searchPlaylist')}
                </Link>
            </div>

            <div className={styles.searchBar}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder={t('songsPage.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredSongs.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyEmoji}>🎧</div>
                    <h3 className={styles.emptyTitle}>{t('songsPage.emptyText')}</h3>
                    <p className={styles.emptySubtitle}>{t('songsPage.emptySubtext')}</p>
                    {isAuthenticated && (
                        <Link to="/songs/create" className={styles.createBtn}>
                            <FaPlus /> {t('songsPage.createBtn')}
                        </Link>
                    )}
                </div>
            ) : (
                <div className={styles.songsGrid}>
                    {filteredSongs.map((song) => {
                        const isPlaying = currentPlayingId === song.id;
                        return (
                            <div key={song.id} className={styles.songCard}>
                                <div className={styles.cardTop}>
                                    <div className={styles.songIcon}>
                                        <FaMusic color="#00f3ff" />
                                    </div>
                                    <div className={styles.songMeta}>
                                        <div className={styles.songTitle} title={song.title}>
                                            {song.title}
                                        </div>
                                        <div className={styles.songAuthor} title={song.author}>
                                            {song.author}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardBottom}>
                                    <span className={styles.durationBadge}>
                                        {formatDuration(song.duration)}
                                    </span>
                                    <div className={styles.cardActions}>
                                        {song.url && (
                                            <button
                                                className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
                                                onClick={() => handleTogglePlay(song.id, song.url)}
                                                title={isPlaying ? t('songsPage.pausePreview') : t('songsPage.playPreview')}
                                            >
                                                {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: '2px' }} />}
                                            </button>
                                        )}
                                        {isAuthenticated && (
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDelete(song.id)}
                                                title={t('common.cancel')}
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AllSongsPage;
