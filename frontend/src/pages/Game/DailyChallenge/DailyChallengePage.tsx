import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useGetDailyChallengeQuery, useSubmitDailyGuessMutation } from '../../../store/api/dailyApi';
import { soundEffects } from '../../../utils/audio/soundEffects';
import styles from './DailyChallengePage.module.css';
import { FaPlay, FaPause, FaShareAlt, FaCheck, FaFire, FaMusic } from 'react-icons/fa';
import { useTranslation } from '../../../i18n/LanguageContext';

const TIERS = [1, 2, 4, 7, 11, 16];

interface SnippetPlayerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    effectiveDuration: number;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onSnippetFinished: () => void;
    audioError: boolean;
    playText: string;
    playingText: string;
    audioErrorText: string;
}

const SnippetPlayer: React.FC<SnippetPlayerProps> = memo(({
    audioRef,
    effectiveDuration,
    isPlaying,
    onTogglePlay,
    onSnippetFinished,
    audioError,
    playText,
    playingText,
    audioErrorText,
}) => {
    const fillRef = useRef<HTMLDivElement | null>(null);
    const timeTextRef = useRef<HTMLDivElement | null>(null);
    const statusTextRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isPlaying) {
            if (fillRef.current) {
                fillRef.current.style.transform = 'scaleX(0)';
            }
            if (timeTextRef.current) {
                timeTextRef.current.textContent = `0.0s / ${effectiveDuration}s`;
            }
            if (statusTextRef.current) {
                statusTextRef.current.textContent = audioError
                    ? audioErrorText
                    : `${playText} (${effectiveDuration}s)`;
            }
            return;
        }

        let animId: number;
        const tick = () => {
            const audio = audioRef.current;
            if (audio) {
                const current = audio.currentTime;
                if (current >= effectiveDuration) {
                    audio.pause();
                    audio.currentTime = 0;
                    if (fillRef.current) fillRef.current.style.transform = 'scaleX(0)';
                    if (timeTextRef.current) timeTextRef.current.textContent = `0.0s / ${effectiveDuration}s`;
                    onSnippetFinished();
                    return;
                }

                const ratio = Math.min(1, current / effectiveDuration);
                if (fillRef.current) {
                    fillRef.current.style.transform = `scaleX(${ratio})`;
                }
                const formattedTime = `${current.toFixed(1)}s / ${effectiveDuration}s`;
                if (timeTextRef.current) {
                    timeTextRef.current.textContent = formattedTime;
                }
                if (statusTextRef.current) {
                    statusTextRef.current.textContent = `🎵 ${playingText} (${formattedTime})`;
                }
            }
            animId = requestAnimationFrame(tick);
        };

        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, [isPlaying, effectiveDuration, onSnippetFinished, audioError, playText, playingText, audioErrorText, audioRef]);

    return (
        <div className={styles.playerCard}>
            <div className={`${styles.vinylDisc} ${isPlaying ? styles.spinning : ''}`}>
                <div className={styles.vinylHole}>
                    <FaMusic />
                </div>
            </div>

            <button
                type="button"
                className={styles.playBtnHero}
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: '4px' }} />}
            </button>

            <div ref={statusTextRef} className={styles.playStatusText}>
                {audioError
                    ? audioErrorText
                    : isPlaying
                    ? `🎵 ${playingText} (0.0s / ${effectiveDuration}s)`
                    : `${playText} (${effectiveDuration}s)`}
            </div>

            <div className={styles.progressWrapper}>
                <div className={styles.progressBarTrack}>
                    <div ref={fillRef} className={styles.progressBarFill} />
                </div>
                <div ref={timeTextRef} className={styles.timeDisplay}>
                    0.0s / {effectiveDuration}s
                </div>
            </div>
        </div>
    );
});

SnippetPlayer.displayName = 'SnippetPlayer';

interface TimelineProps {
    tiers: number[];
    attempts: Array<{ text: string; isCorrect: boolean }>;
    isCompleted: boolean;
    effectiveDuration: number;
}

const TimelineGrid: React.FC<TimelineProps> = memo(({
    tiers,
    attempts,
    isCompleted,
    effectiveDuration,
}) => {
    return (
        <div className={styles.timelineContainer}>
            <div className={styles.timelineGrid}>
                {tiers.map((tierSec, idx) => {
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
    );
});

TimelineGrid.displayName = 'TimelineGrid';

const DailyChallengePage: React.FC = () => {
    const { t } = useTranslation();
    const { data, isLoading, refetch } = useGetDailyChallengeQuery();
    const [submitGuess, { isLoading: isSubmitting }] = useSubmitDailyGuessMutation();

    const [guessMode, setGuessMode] = useState<'options' | 'manual'>('options');
    const [guessInput, setGuessInput] = useState('');
    const [attempts, setAttempts] = useState<Array<{ text: string; isCorrect: boolean }>>([]);
    const [isPlaying, setIsPlaying] = useState(false);
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

    const handleTogglePlay = useCallback(() => {
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
    }, [isPlaying, effectiveDuration]);

    const handleSnippetFinished = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const handleSelectTier = useCallback((durationSec: number) => {
        setSelectedTierDuration(durationSec);
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
    }, []);

    const handleAudioError = useCallback(() => {
        setIsPlaying(false);
        setAudioError(true);
    }, []);

    const handleGuessSubmit = useCallback(async (guessText: string) => {
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
    }, [attempts, isCompleted, isSubmitting, submitGuess, refetch]);

    const handleSkip = useCallback(() => {
        if (isCompleted || isSubmitting) return;
        handleGuessSubmit(t('daily.skip'));
    }, [isCompleted, isSubmitting, handleGuessSubmit, t]);

    const handleShare = useCallback(async () => {
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
    }, [data]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {data?.preview && (
                <audio
                    ref={audioRef}
                    src={data.preview}
                    preload="auto"
                    onEnded={handleSnippetFinished}
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
            <TimelineGrid
                tiers={TIERS}
                attempts={attempts}
                isCompleted={isCompleted}
                effectiveDuration={effectiveDuration}
            />

            {/* Hero Player Card - High performance RAF and ScaleX */}
            <SnippetPlayer
                audioRef={audioRef}
                effectiveDuration={effectiveDuration}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onSnippetFinished={handleSnippetFinished}
                audioError={audioError}
                playText={t('daily.pressPlay')}
                playingText={t('daily.playingSnippet')}
                audioErrorText={t('daily.audioError')}
            />

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

export default memo(DailyChallengePage);