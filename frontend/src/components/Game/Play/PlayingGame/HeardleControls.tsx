import React from 'react';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './HeardleControls.module.css';

interface Props {
    unlockedSeconds: number;
    onUnlockNext: () => void;
    onReplay?: () => void;
    canUnlockMore: boolean;
    hasAnswered: boolean;
}

export const HEARDLE_TIERS = [1, 2, 5, 10, 20];

const HeardleControls: React.FC<Props> = ({
    unlockedSeconds,
    onUnlockNext,
    onReplay,
    canUnlockMore,
    hasAnswered,
}) => {
    const { t } = useTranslation();

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
                    {t('gameplay.heardleModeTitle', { seconds: unlockedSeconds })}
                </span>
                <span className={styles.bonusBadge}>
                    {t('gameplay.potentialPoints', { points: getPotentialPoints(unlockedSeconds) })}
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
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {onReplay && (
                        <button
                            type="button"
                            className={styles.unlockButton}
                            onClick={onReplay}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <span>↺</span> {t('daily.listenSnippet')}
                        </button>
                    )}
                    <button
                        type="button"
                        className={styles.unlockButton}
                        onClick={onUnlockNext}
                        disabled={!canUnlockMore}
                    >
                        {canUnlockMore
                            ? t('gameplay.revealMoreAudio')
                            : t('gameplay.allSnippetsRevealed')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HeardleControls;