import React, { useState, useEffect, useRef } from 'react';
import { useGetDailyChallengeQuery, useSubmitDailyGuessMutation } from '../../../store/api/dailyApi';
import { soundEffects } from '../../../utils/audio/soundEffects';
import styles from './DailyChallengePage.module.css';
import { FaPlay, FaPause, FaShareAlt, FaCheck, FaFire } from 'react-icons/fa';
import { useTranslation } from '../../../i18n/LanguageContext';

const TIERS = [1, 2, 4, 7, 11, 16];

const DailyChallengePage: React.FC = () => {
    const { t } = useTranslation();
    const { data, isLoading, refetch } = useGetDailyChallengeQuery();
    const [submitGuess, { isLoading: isSubmitting }] = useSubmitDailyGuessMutation();

    const [guessInput, setGuessInput] = useState('');
    const [attempts, setAttempts] = useState<Array<{ text: string; isCorrect: boolean }>>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [copied, setCopied] = useState(false);

    const [selectedTierDuration, setSelectedTierDuration] = useState<number | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentTierIndex = Math.min(TIERS.length - 1, attempts.length);
    const maxDuration = TIERS[currentTierIndex];

    const isCompleted = data?.isCompleted || (attempts.length >= 6) || attempts.some((a) => a.isCorrect);
    const isSolved = data?.isSolved || attempts.some((a) => a.isCorrect);
    const effectiveDuration = isCompleted ? (selectedTierDuration ?? 30) : maxDuration;

    useEffect(() => {
        if (data?.isCompleted) {
            const reconstructed = [];
            for (let i = 1; i <= data.guessesCount; i++) {
                reconstructed.push({
                    text: i === data.guessesCount && data.isSolved ? `${data.track?.artistName} - ${data.track?.title}` : `${t('daily.attempt')} #${i}`,
                    isCorrect: i === data.guessesCount && data.isSolved,
                });
            }
            setAttempts(reconstructed);
        }
    }, [data, t]);

    const handleTogglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.currentTime = 0;
            audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    };

    const handleSelectTier = (durationSec: number) => {
        setSelectedTierDuration(durationSec);
        setPlaybackTime(0);
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (!audio) return;

        setPlaybackTime(audio.currentTime);
        if (audio.currentTime >= effectiveDuration) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false);
            setPlaybackTime(0);
        }
    };

    const handleGuessSubmit = async (guessText: string) => {
        if (!guessText.trim() || isCompleted || isSubmitting) return;

        const attemptNum = attempts.length + 1;
        try {
            const res = await submitGuess({ guess: guessText.trim(), attempt: attemptNum }).unwrap();

            const newAttempts = [...attempts, { text: guessText.trim(), isCorrect: res.isCorrect }];
            setAttempts(newAttempts);
            setGuessInput('');

            if (res.isCorrect) {
                soundEffects.playCorrect();
                if ((res.streak || 0) >= 3) {
                    setTimeout(() => soundEffects.playStreak(res.streak || 3), 350);
                }
            } else {
                soundEffects.playIncorrect();
            }

            refetch();
        } catch (err) {
            console.error('Failed to submit guess', err);
        }
    };

    const handleSkip = () => {
        if (isCompleted || isSubmitting) return;
        handleGuessSubmit(t('daily.skip'));
    };

    const handleShare = async () => {
        const textToShare = data?.shareText || `SonGuess Daily #${data?.dayNumber}\nhttps://songuess.app/game/daily`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'SonGuess Daily Challenge',
                    text: textToShare,
                });
                return;
            } catch {
                // fallback to clipboard
            }
        }

        try {
            await navigator.clipboard.writeText(textToShare);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // ignore
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    const progressPercent = Math.min(100, (playbackTime / effectiveDuration) * 100);

    return (
        <div className={styles.container}>
            {data?.preview && (
                <audio
                    ref={audioRef}
                    src={data.preview}
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    onError={() => {
                        setIsPlaying(false);
                    }}
                />
            )}

            <div className={styles.header}>
                <h1 className={styles.title}>{t('daily.title')} #{data?.dayNumber}</h1>
                <div className={styles.dateRow}>
                    <span>{data?.date}</span>
                    <span className={styles.streakPill}>
                        <FaFire /> {data?.streak || 0} {t('common.days')} {t('leaderboard.streak').toLowerCase()} ({t('profile.record')}: {data?.maxStreak || 0})
                    </span>
                </div>
            </div>

            {/* Сповіщення про відкриті всі рівні після завершення гри */}
            {isCompleted && (
                <>
                    <div className={styles.unlockedNotice}>
                        <div className={styles.unlockedIcon}>🔓</div>
                        <div>
                            <div className={styles.unlockedTitle}>{t('daily.allTiersUnlocked')}</div>
                            <div className={styles.unlockedSubtitle}>{t('daily.allTiersDesc')}</div>
                        </div>
                    </div>

                    <div className={styles.tierPillsRow}>
                        {TIERS.map((tierSec, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`${styles.tierPill} ${effectiveDuration === tierSec ? styles.activeTierPill : ''}`}
                                onClick={() => handleSelectTier(tierSec)}
                            >
                                <FaPlay style={{ fontSize: '9px' }} /> {tierSec}s
                            </button>
                        ))}
                        <button
                            type="button"
                            className={`${styles.tierPill} ${styles.fullTrackPill} ${effectiveDuration === 30 ? styles.activeTierPill : ''}`}
                            onClick={() => handleSelectTier(30)}
                        >
                            <FaPlay style={{ fontSize: '9px' }} /> {t('daily.fullTrack')}
                        </button>
                    </div>
                </>
            )}

            {/* Плеєр фрагмента */}
            <div className={styles.playerSection}>
                <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                </div>
                <div className={styles.audioControlsRow}>
                    <button
                        className={styles.playBtn}
                        onClick={handleTogglePlay}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <span className={styles.snippetDurationLabel}>
                        {playbackTime.toFixed(1)}s / {effectiveDuration}s
                    </span>
                </div>
            </div>

            {/* Сітка 6 спроб */}
            <div className={styles.attemptsList}>
                {Array.from({ length: 6 }).map((_, index) => {
                    const attempt = attempts[index];
                    let statusClass = styles.empty;
                    let content = `${t('daily.attempt')} ${index + 1} (${TIERS[index]}s)`;

                    if (attempt) {
                        statusClass = attempt.isCorrect ? styles.correct : styles.wrong;
                        content = attempt.isCorrect ? `🟩 ${attempt.text}` : `🟥 ${attempt.text}`;
                    }

                    return (
                        <div key={index} className={`${styles.attemptRow} ${statusClass}`}>
                            <span>{content}</span>
                            {isCompleted && (
                                <button
                                    type="button"
                                    className={styles.tierPlayBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectTier(TIERS[index]);
                                    }}
                                    title={`${t('daily.listenTier')} ${TIERS[index]}s`}
                                    aria-label={`${t('daily.listenTier')} ${TIERS[index]}s`}
                                >
                                    <FaPlay style={{ fontSize: '9px', marginLeft: '1px' }} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Форма введення (якщо ще не завершено) */}
            {!isCompleted ? (
                <div className={styles.inputSection}>
                    <div className={styles.typeInRow}>
                        <input
                            type="text"
                            className={styles.textInput}
                            placeholder={t('daily.typeGuess')}
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGuessSubmit(guessInput)}
                        />
                        <button
                            className={styles.submitBtn}
                            onClick={() => handleGuessSubmit(guessInput)}
                            disabled={!guessInput.trim() || isSubmitting}
                        >
                            {t('daily.guessBtn')}
                        </button>
                    </div>

                    {data?.options && data.options.length > 0 && (
                        <>
                            <div className={styles.optionsTitle}>{t('daily.selectOption')}</div>
                            <div className={styles.optionsGrid}>
                                {data.options.map((option, i) => (
                                    <button
                                        key={i}
                                        className={styles.optionBtn}
                                        onClick={() => handleGuessSubmit(option)}
                                        disabled={isSubmitting}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <div className={styles.actionRow}>
                        <button className={styles.skipBtn} onClick={handleSkip} disabled={isSubmitting}>
                            {t('daily.skip')} (+{TIERS[Math.min(TIERS.length - 1, attempts.length + 1)] - maxDuration}s)
                        </button>
                    </div>
                </div>
            ) : (
                /* Результат гри */
                <div className={`${styles.resultCard} ${isSolved ? styles.solved : styles.failed}`}>
                    <div className={styles.resultHeader}>
                        {isSolved ? t('daily.solvedSuccess') : t('daily.failedText')}
                    </div>

                    {data?.track && (
                        <div className={styles.trackInfoBox}>
                            <div className={styles.trackTitle}>{data.track.title}</div>
                            <div className={styles.trackArtist}>{data.track.artistName}</div>
                        </div>
                    )}

                    <button className={styles.shareBtn} onClick={handleShare}>
                        {copied ? <FaCheck /> : <FaShareAlt />}
                        {copied ? t('daily.shareCopied') : t('daily.shareBtn')}
                    </button>
                    {copied && <div className={styles.toast}>{t('daily.shareCopied')}</div>}
                </div>
            )}
        </div>
    );
};

export default DailyChallengePage;