import React, { useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { selectTrackInfo, selectRoundResult, selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';
import { soundEffects } from '../../../../utils/audio/soundEffects';
import { FaRegClock } from 'react-icons/fa';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './RoundTimer.module.css';

const RoundTimer: React.FC = () => {
    const { t } = useTranslation();
    const trackInfo = useAppSelector(selectTrackInfo);
    const roundResult = useAppSelector(selectRoundResult);
    const currentRoom = useAppSelector(selectCurrentRoom);

    const fallbackRoundMs = (currentRoom?.lobbyOptions?.roundDuration || 25) * 1000;
    const totalMs = trackInfo?.endsAt && trackInfo?.startedAt
        ? (trackInfo.endsAt - trackInfo.startedAt)
        : fallbackRoundMs;

    const [remainingMs, setRemainingMs] = useState<number>(() => totalMs);
    const lastTickedSecondRef = useRef<number | null>(null);

    useEffect(() => {
        lastTickedSecondRef.current = null;
        if (trackInfo?.startedAt) {
            const initialDeadline = trackInfo.endsAt ?? (trackInfo.startedAt + fallbackRoundMs);
            setRemainingMs(Math.max(0, initialDeadline - Date.now()));
        }
    }, [trackInfo?.roundNumber, trackInfo?.startedAt, trackInfo?.endsAt, fallbackRoundMs]);

    useEffect(() => {
        if (!trackInfo?.startedAt || roundResult) return;

        // Якщо бекенд передає endsAt — використовуємо його (враховує clock skew між сервером і клієнтом).
        const deadline = trackInfo.endsAt ?? (trackInfo.startedAt + fallbackRoundMs);

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
    }, [trackInfo?.startedAt, trackInfo?.endsAt, roundResult, fallbackRoundMs]);

    if (!trackInfo || roundResult) return null;

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
