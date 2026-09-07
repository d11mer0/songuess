import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateSongMutation } from '../../store/api/songsApi';
import { useSearchDeezerQuery } from '../../store/api/deezerApi';
import { useTranslation } from '../../i18n/LanguageContext';
import styles from './CreateSongPage.module.css';
import { FaPlay, FaPause, FaSearch, FaArrowLeft, FaCheck } from 'react-icons/fa';

const CreateSongPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [createSong, { isLoading: isCreating }] = useCreateSongMutation();

    const [deezerQuery, setDeezerQuery] = useState('');
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [duration, setDuration] = useState<number>(30);
    const [url, setUrl] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [previewPlaying, setPreviewPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { data: searchResults, isLoading: isSearching } = useSearchDeezerQuery(
        { query: deezerQuery, type: 'track' },
        { skip: deezerQuery.trim().length < 2 },
    );

    const handleSelectDeezerTrack = (track: any) => {
        setTitle(track.title || '');
        setAuthor(track.artist?.name || '');
        setDuration(track.duration || 30);
        setUrl(track.preview || '');
    };

    const handleTogglePreview = () => {
        if (!url || !audioRef.current) return;

        if (previewPlaying) {
            audioRef.current.pause();
            setPreviewPlaying(false);
        } else {
            audioRef.current.src = url;
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => setPreviewPlaying(true)).catch(() => setPreviewPlaying(false));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!title.trim() || !author.trim() || !url.trim()) {
            setErrorMsg(t('createSongPage.errorMsg'));
            return;
        }

        try {
            await createSong({
                title: title.trim(),
                author: author.trim(),
                duration: Number(duration) || 30,
                url: url.trim(),
            }).unwrap();

            navigate('/songs');
        } catch (err: any) {
            console.error('Failed to create song', err);
            setErrorMsg(err?.data?.message || t('createSongPage.errorMsg'));
        }
    };

    return (
        <div className={styles.container}>
            <audio
                ref={audioRef}
                onEnded={() => setPreviewPlaying(false)}
                onError={() => setPreviewPlaying(false)}
            />

            <Link to="/songs" className={styles.backBtn}>
                <FaArrowLeft /> {t('createSongPage.backBtn')}
            </Link>

            <h1 className={styles.title}>{t('createSongPage.title')}</h1>
            <p className={styles.subtitle}>{t('createSongPage.subtitle')}</p>

            {/* Блок імпорту з Deezer */}
            <div className={styles.deezerCard}>
                <div className={styles.deezerTitle}>
                    <FaSearch /> {t('createSongPage.deezerSearchTitle')}
                </div>
                <p className={styles.deezerDesc}>
                    {t('createSongPage.deezerSearchPlaceholder')}
                </p>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Наприклад: Queen - Bohemian Rhapsody..."
                    value={deezerQuery}
                    onChange={(e) => setDeezerQuery(e.target.value)}
                />

                {isSearching && <p style={{ color: '#888', fontSize: '13px' }}>Пошук у Deezer...</p>}

                {searchResults?.data && searchResults.data.length > 0 && (
                    <div className={styles.resultsList}>
                        {searchResults.data.slice(0, 5).map((track: any) => (
                            <div key={track.id} className={styles.resultItem}>
                                {track.album?.cover_small && (
                                    <img
                                        src={track.album.cover_small}
                                        alt={track.title}
                                        className={styles.resultCover}
                                    />
                                )}
                                <div className={styles.resultInfo}>
                                    <div className={styles.resultTitle}>{track.title}</div>
                                    <div className={styles.resultArtist}>{track.artist?.name}</div>
                                </div>
                                <button
                                    type="button"
                                    className={styles.selectBtn}
                                    onClick={() => handleSelectDeezerTrack(track)}
                                >
                                    <FaCheck style={{ marginRight: '4px' }} /> {t('createSongPage.selectFromSearch')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Форма треку */}
            <form className={styles.formCard} onSubmit={handleSubmit}>
                {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('createSongPage.formTitle')} *</label>
                    <input
                        type="text"
                        className={styles.input}
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Назва треку..."
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('createSongPage.formArtist')} *</label>
                    <input
                        type="text"
                        className={styles.input}
                        required
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Виконавець..."
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('createSongPage.formDuration')} *</label>
                    <input
                        type="number"
                        min="5"
                        max="600"
                        className={styles.input}
                        required
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('createSongPage.formUrl')} *</label>
                    <input
                        type="url"
                        className={styles.input}
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                    />
                    <div className={styles.helpText}>{t('createSongPage.formUrlHelp')}</div>

                    {url && (
                        <div className={styles.audioTestRow}>
                            <button
                                type="button"
                                className={styles.testPlayBtn}
                                onClick={handleTogglePreview}
                            >
                                {previewPlaying ? <FaPause /> : <FaPlay />} {previewPlaying ? t('songsPage.pausePreview') : t('songsPage.playPreview')}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.submitRow}>
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isCreating}
                    >
                        {isCreating ? t('createSongPage.submittingBtn') : t('createSongPage.submitBtn')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateSongPage;
