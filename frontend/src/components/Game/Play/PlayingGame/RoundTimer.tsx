import React, { useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { selectTrackInfo, selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import { soundEffects } from '../../../../utils/audio/soundEffects';
import { FaRegClock } from 'react-icons/fa';
import styles from './RoundTimer.module.css';

const TOTAL_ROUND_MS = 25000;

const RoundTimer: React.FC = () => {
    const trackInfo = useAppSelector(selectTrackInfo);
    const roundResult = useAppSelector(selectRoundResult);

    const [remainingMs, setRemainingMs] = useState(TOTAL_ROUND_MS);
    const lastTickedSecondRef = useRef<number | null>(null);

    useEffect(() => {
        lastTickedSecondRef.current = null;
    }, [trackInfo?.roundNumber]);

    useEffect(() => {
        if (!trackInfo?.startedAt || roundResult) return;

        const updateTimer = () => {
            const elapsed = Date.now() - trackInfo.startedAt;
            const remaining = Math.max(0, TOTAL_ROUND_MS - elapsed);
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
    }, [trackInfo?.startedAt, roundResult]);

    if (!trackInfo || roundResult) return null;

    const percent = Math.min(100, Math.max(0, (remainingMs / TOTAL_ROUND_MS) * 100));
    const secondsLeft = Math.ceil(remainingMs / 1000);
    const isUrgent = secondsLeft <= 3 && secondsLeft > 0;

    return (
        <div className={styles.timerContainer}>
            <div className={styles.timerInfoRow}>
                <div className={styles.timeLabel}>
                    <FaRegClock /> Time Left
                </div>
                <div className={`${styles.secondsNumber} ${isUrgent ? styles.danger : ''}`}>
                    {secondsLeft}s
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