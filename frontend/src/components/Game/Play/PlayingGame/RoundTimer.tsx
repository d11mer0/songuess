import React, { useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { selectTrackInfo, selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import { soundEffects } from '../../../../utils/audio/soundEffects';
import { FaRegClock } from 'react-icons/fa';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './RoundTimer.module.css';

const TOTAL_ROUND_MS = 25000;

const RoundTimer: React.FC = () => {
    const { t } = useTranslation();
    const trackInfo = useAppSelector(selectTrackInfo);
    const roundResult = useAppSelector(selectRoundResult);

    const [remainingMs, setRemainingMs] = useState(TOTAL_ROUND_MS);
    const lastTickedSecondRef = useRef<number | null>(null);

    useEffect(() => {
        lastTickedSecondRef.current = null;
    }, [trackInfo?.roundNumber]);

    useEffect(() => {
        if (!trackInfo?.startedAt || roundResult) return;

        // Якщо бекенд передає endsAt — використовуємо його (враховує clock skew між сервером і клієнтом).
        // Fallback: startedAt + TOTAL_ROUND_MS (для зворотної сумісності).
        const deadline = trackInfo.endsAt ?? (trackInfo.startedAt + TOTAL_ROUND_MS);

        const updateTimer = () => {
            const remaining = Math.max(0, deadline - Date.now());
            setRemainingMs(remaining);

            const secondsLeft = Math.ceil(remaining / 1000);

            // Тікання на останніх 3 секундах (3, 2, 1)
            if (secondsLeft <= 3 && secondsLeft > 0 && !roundResult) {
                if (lastTickedSecondRef.current !== secondsLeft) {
                    lastTickedSecondRef.current = secondsLeft;
                    soundEffects.playTick(secondsLeft);
                }
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);

        return () => clearInterval(interval);
    }, [trackInfo?.startedAt, trackInfo?.endsAt, roundResult]);

    if (!trackInfo || roundResult) return null;

    const deadline = trackInfo.endsAt ?? (trackInfo.startedAt + TOTAL_ROUND_MS);
    const totalMs = trackInfo.endsAt
        ? (trackInfo.endsAt - trackInfo.startedAt)
        : TOTAL_ROUND_MS;

    const percent = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));
    const secondsLeft = Math.ceil(remainingMs / 1000);
    const isUrgent = secondsLeft <= 3 && secondsLeft > 0;

    return (
        <div className={styles.timerContainer}>
            <div className={styles.timerInfoRow}>
                <div className={styles.timeLabel}>
                    <FaRegClock /> {t('gameplay.timeLeft')}
                </div>
                <div className={`${styles.secondsNumber} ${isUrgent ? styles.danger : ''}`}>
                    {secondsLeft}{t('common.secondsShort')}
                </div>
            </div>
            <div className={styles.timerBarWrapper}>
                <div
                    className={`${styles.timerBar} ${isUrgent ? styles.danger : ''}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

export default RoundTimer;
