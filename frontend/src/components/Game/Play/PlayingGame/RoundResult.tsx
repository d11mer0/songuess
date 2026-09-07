import { useEffect } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import { soundEffects } from '../../../../utils/audio/soundEffects';
import styles from '../PlayingGame.module.css';
import { FaCheckCircle, FaTimesCircle, FaRegClock, FaFire } from 'react-icons/fa';
import { useTranslation } from '../../../../i18n/LanguageContext';

const RoundResult = () => {
    const { t } = useTranslation();
    const result = useAppSelector(selectRoundResult);

    useEffect(() => {
        if (!result || !result.myResult) return;

        if (result.myResult.isCorrect) {
            soundEffects.playCorrect();
            if (result.myResult.streak && result.myResult.streak >= 3) {
                const timer = setTimeout(() => {
                    soundEffects.playStreak(result.myResult.streak!);
                }, 350);
                return () => clearTimeout(timer);
            }
        } else {
            soundEffects.playIncorrect();
        }
    }, [result]);

    if (!result || !result.myResult) return null;

    const getStatus = () => {
        if (result.myResult.isCorrect) return { icon: <FaCheckCircle />, text: t('gameplay.correct'), className: styles.success };
        if (result.correctAnswer && !result.myResult.answer) return { icon: <FaRegClock />, text: t('gameplay.noAnswer'), className: styles.timeout };
        return { icon: <FaTimesCircle />, text: t('gameplay.incorrect'), className: styles.failure };
    };

    const { icon, text, className } = getStatus();
    const streak = result.myResult.streak ?? 0;

    return (
        <div className={styles.roundResultWrapper}>
            <div className={`${styles.resultAnimation} ${className}`}>
                <span className={styles.resultIcon}>{icon}</span>
                {text}
            </div>

            {streak >= 3 && (
                <div className={styles.streakAlert}>
                    <FaFire className={styles.streakFlameIcon} />
                    {streak >= 5 ? (
                        <span>{t('gameplay.superStreakBonus', { streak })}</span>
                    ) : (
                        <span>{t('gameplay.streakBonus', { streak })}</span>
                    )}
                </div>
            )}

            {result.myResult.timeTaken !== null && result.myResult.timeTaken > 0 && (
                <div className={styles.responseTime}>
                    {t('gameplay.answeredIn')} {(result.myResult.timeTaken / 1000).toFixed(2)}s
                </div>
            )}
        </div>
    );
};

export default RoundResult;