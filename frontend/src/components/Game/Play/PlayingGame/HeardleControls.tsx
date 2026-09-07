import React from 'react';
import styles from './HeardleControls.module.css';

interface Props {
    unlockedSeconds: number;
    onUnlockNext: () => void;
    canUnlockMore: boolean;
    hasAnswered: boolean;
}

export const HEARDLE_TIERS = [1, 2, 5, 10, 20];

const HeardleControls: React.FC<Props> = ({
    unlockedSeconds,
    onUnlockNext,
    canUnlockMore,
    hasAnswered,
}) => {
    const getPotentialPoints = (sec: number) => {
        if (sec <= 1) return 500;
        if (sec <= 2) return 400;
        if (sec <= 5) return 300;
        if (sec <= 10) return 200;
        return 100;
    };

    return (
        <div className={styles.container}>
            <div className={styles.heardleHeader}>
                <span className={styles.heardleTitle}>
                    ⏱️ Режим Heardle: відкрито {unlockedSeconds} сек
                </span>
                <span className={styles.bonusBadge}>
                    Потенційні бали: {getPotentialPoints(unlockedSeconds)} pts
                </span>
            </div>

            <div className={styles.timeline}>
                {HEARDLE_TIERS.map((tier) => (
                    <div
                        key={tier}
                        className={`${styles.timelineSegment} ${
                            tier <= unlockedSeconds ? styles.unlocked : ''
                        }`}
                    />
                ))}
            </div>

            <div className={styles.timelineLabels}>
                {HEARDLE_TIERS.map((tier) => (
                    <span key={tier}>{tier}s</span>
                ))}
            </div>

            {!hasAnswered && (
                <button
                    className={styles.unlockButton}
                    onClick={onUnlockNext}
                    disabled={!canUnlockMore}
                >
                    {canUnlockMore
                        ? `⏩ Розкрити більше звуку (+сек)`
                        : 'Всі фрагменти розкрито'}
                </button>
            )}
        </div>
    );
};

export default HeardleControls;