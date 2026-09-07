import React, { useState, useEffect, useRef } from 'react';
import { useGetDailyChallengeQuery, useSubmitDailyGuessMutation } from '../../../store/api/dailyApi';
import { soundEffects } from '../../../utils/audio/soundEffects';
import styles from './DailyChallengePage.module.css';
import { FaPlay, FaPause, FaShareAlt, FaCheck, FaFire, FaMusic } from 'react-icons/fa';
import { useTranslation } from '../../../i18n/LanguageContext';

const TIERS = [1, 2, 4, 7, 11, 16];

const DailyChallengePage: React.FC = () => {
    const { t } = useTranslation();
    const { data, isLoading, refetch } = useGetDailyChallengeQuery();
    const [submitGuess, { isLoading: isSubmitting }] = useSubmitDailyGuessMutation();

    const [guessMode, setGuessMode] = useState<'options' | 'manual'>('options');
    const [guessInput, setGuessInput] = useState('');
    const [attempts, setAttempts] = useState<Array<{ text: string; isCorrect: boolean }>>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [audioError, setAudioError] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedTierDuration, setSelectedTierDuration] = useState<number | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentTierIndex = Math.min(TIERS.length - 1, attempts.length);
    const maxDuration = TIERS[currentTierIndex];

    const isCompleted = Boolean(data?.isCompleted || attempts.length >= 6 || attempts.some((a) => a.isCorrect));
    const isSolved = Boolean(data?.isSolved || attempts.some((a) => a.isCorrect));
    const effectiveDuration = isCompleted ? (selectedTierDuration ?? 30) : maxDuration;

    const nextTierIndex = Math.min(TIERS.length - 1, attempts.length + 1);
    const diffSec = TIERS[nextTierIndex] - maxDuration;

    useEffect(() => {
        if (data?.isCompleted) {
            const reconstructed = [];
            for (let i = 1; i <= data.guessesCount; i++) {
                reconstructed.push({
                    text: i === data.guessesCount && data.isSolved
                        ? `${data.track?.artistName} - ${data.track?.title}`
                        : `${t('daily.attempt')} #${i}`,
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
            setAudioError(false);
            if (audio.currentTime >= effectiveDuration) {
                audio.currentTime = 0;
            }
            audio.play()
                .then(() => setIsPlaying(true))
                .catch((err) => {
                    console.warn('Daily audio play error:', err);
                    setIsPlaying(false);
                    setAudioError(true);
                });
        }
    };

    const handleSelectTier = (durationSec: number) => {
        setSelectedTierDuration(durationSec);
        setPlaybackTime(0);
        setAudioError(false);
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
                console.warn('Tier playback error:', err);
                setIsPlaying(false);
                setAudioError(true);
            });
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

    const handleAudioError = () => {
        setIsPlaying(false);
        setAudioError(true);
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
                    onEnded={() => {
                        setIsPlaying(false);
                        setPlaybackTime(0);
                    }}
                    onError={handleAudioError}
                />
            )}

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>{t('daily.title')} #{data?.dayNumber}</h1>
                <p className={styles.subtitle}>{t('daily.subtitle')}</p>
                <div className={styles.dateRow}>
                    <span>{data?.date}</span>
                    <span className={styles.streakPill}>
                        <FaFire /> {data?.streak || 0} {t('common.days')} ({t('profile.record')}: {data?.maxStreak || 0})
                    </span>
                </div>
            </div>

            {/* 6-Segment Timeline */}
            <div className={styles.timelineContainer}>
                <div className={styles.timelineGrid}>
                    {TIERS.map((tierSec, idx) => {
                        const isCurrent = !isCompleted && idx === attempts.length;
                        const isTierSelected = isCompleted && effectiveDuration === tierSec;
                        const attempt = attempts[idx];

                        let statusClass = '';
                        if (attempt?.isCorrect) statusClass = styles.correct;
                        else if (attempt && !attempt.isCorrect) statusClass = styles.wrong;
                        else if (isCurrent || isTierSelected) statusClass = styles.active;

                        return (
                            <div key={idx} className={`${styles.timelineSegment} ${statusClass}`}>
                                <span>{tierSec}s</span>
                                <span style={{ fontSize: '10px', marginTop: '2px' }}>
                                    {attempt ? (attempt.isCorrect ? '✓' : '✗') : (isCurrent ? '▶' : '·')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hero Player Card */}
            <div className={styles.playerCard}>
                <div className={`${styles.vinylDisc} ${isPlaying ? styles.spinning : ''}`}>
                    <div className={styles.vinylHole}>
                        <FaMusic />
                    </div>
                </div>

                <button
                    type="button"
                    className={styles.playBtnHero}
                    onClick={handleTogglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: '4px' }} />}
                </button>

                <div className={styles.playStatusText}>
                    {audioError
                        ? t('daily.audioError')
                        : isPlaying
                        ? `${t('daily.playingSnippet')} (${playbackTime.toFixed(1)}s / ${effectiveDuration}s)`
                        : `${t('daily.pressPlay')} (${effectiveDuration}s)`}
                </div>

                <div className={styles.progressWrapper}>
                    <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className={styles.timeDisplay}>
                        {playbackTime.toFixed(1)}s / {effectiveDuration}s
                    </div>
                </div>
            </div>

            {/* Guessing controls (if game not finished) */}
            {!isCompleted ? (
                <div>
                    {data?.options && data.options.length > 0 && (
                        <div className={styles.modeSwitcher}>
                            <button
                                type="button"
                                className={`${styles.modeTab} ${guessMode === 'options' ? styles.activeMode : ''}`}
                                onClick={() => setGuessMode('options')}
                            >
                                {t('daily.optionsMode')}
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeTab} ${guessMode === 'manual' ? styles.activeMode : ''}`}
                                onClick={() => setGuessMode('manual')}
                            >
                                {t('daily.manualMode')}
                            </button>
                        </div>
                    )}

                    {guessMode === 'options' && data?.options && data.options.length > 0 ? (
                        <div className={styles.optionsGrid}>
                            {data.options.map((option, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={styles.optionCard}
                                    onClick={() => handleGuessSubmit(option)}
                                    disabled={isSubmitting}
                                >
                                    <FaMusic className={styles.optionIcon} />
                                    <span className={styles.optionText}>{option}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.manualInputRow}>
                            <input
                                type="text"
                                className={styles.textInput}
                                placeholder={t('daily.typeGuess')}
                                value={guessInput}
                                onChange={(e) => setGuessInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGuessSubmit(guessInput)}
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                className={styles.submitBtn}
                                onClick={() => handleGuessSubmit(guessInput)}
                                disabled={!guessInput.trim() || isSubmitting}
                            >
                                {t('daily.guessBtn')}
                            </button>
                        </div>
                    )}

                    <div className={styles.skipActionRow}>
                        <button
                            type="button"
                            className={styles.skipBtn}
                            onClick={handleSkip}
                            disabled={isSubmitting}
                        >
                            {t('daily.skip')} {diffSec > 0 ? `(+${diffSec}s)` : ''}
                        </button>
                    </div>

                    {attempts.length > 0 && (
                        <div className={styles.attemptsHistory}>
                            <div className={styles.historyTitle}>{t('daily.attempt')}s</div>
                            <div className={styles.historyChips}>
                                {attempts.map((att, idx) => (
                                    <div
                                        key={idx}
                                        className={`${styles.historyChip} ${att.isCorrect ? styles.correctChip : styles.wrongChip}`}
                                    >
                                        <span>{att.isCorrect ? '✓' : '✗'}</span>
                                        <span>{att.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Completed summary & Unlocked Tiers */
                <div>
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

                        <button type="button" className={styles.shareBtn} onClick={handleShare}>
                            {copied ? <FaCheck /> : <FaShareAlt />}
                            {copied ? t('daily.shareCopied') : t('daily.shareBtn')}
                        </button>
                        {copied && <div className={styles.toast}>{t('daily.shareCopied')}</div>}
                    </div>

                    <div className={styles.unlockedSection}>
                        <div className={styles.unlockedHeader}>
                            <span>🔓</span>
                            <span className={styles.unlockedTitle}>{t('daily.allTiersUnlocked')}</span>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyChallengePage;