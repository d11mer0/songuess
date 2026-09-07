import React from 'react';
import { useGetMyAchievementsQuery, AchievementItem } from '../../store/api/achievementsApi';
import { useTranslation } from '../../i18n/LanguageContext';

export const AchievementsShowcase: React.FC = () => {
    const { t, language } = useTranslation();
    const { data, isLoading } = useGetMyAchievementsQuery();

    if (isLoading) {
        return <div className="text-secondary small">{t('common.loading')}</div>;
    }

    const achievements = data?.achievements || [];
    const totalUnlocked = data?.totalUnlocked || 0;
    const totalCount = data?.totalCount || achievements.length;
    const percentage = data?.percentage || 0;

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'LEGENDARY': return '#ffd700'; // Gold
            case 'EPIC': return '#bd00ff';      // Purple
            case 'RARE': return '#00f3ff';      // Cyan
            default: return '#39ff14';          // Neon Green
        }
    };

    const getRarityLabel = (rarity: string) => {
        switch (rarity) {
            case 'LEGENDARY': return t('achievements.rarityLegendary');
            case 'EPIC': return t('achievements.rarityEpic');
            case 'RARE': return t('achievements.rarityRare');
            default: return t('achievements.rarityCommon');
        }
    };

    return (
        <div style={{ marginTop: '28px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#ffffff' }}>
                        {t('achievements.title')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaaaaa' }}>
                        {t('achievements.subtitle')}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00f3ff' }}>
                        {totalUnlocked}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#888888' }}> / {totalCount}</span>
                </div>
            </div>

            {/* Прогрес бар */}
            <div
                style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '18px',
                }}
            >
                <div
                    style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00f3ff 0%, #ff007f 50%, #ffd700 100%)',
                        transition: 'width 0.4s ease',
                    }}
                />
            </div>

            {/* Сітка карток */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '14px',
                }}
            >
                {achievements.map((ach: AchievementItem) => {
                    const rarityColor = getRarityColor(ach.rarity);
                    const title = language === 'uk' ? ach.titleUk : ach.titleEn;
                    const desc = language === 'uk' ? ach.descUk : ach.descEn;

                    return (
                        <div
                            key={ach.id}
                            style={{
                                borderRadius: '12px',
                                padding: '14px',
                                backgroundColor: ach.isUnlocked
                                    ? 'rgba(20, 20, 35, 0.85)'
                                    : 'rgba(15, 15, 20, 0.4)',
                                border: ach.isUnlocked
                                    ? `1px solid ${rarityColor}`
                                    : '1px solid rgba(255, 255, 255, 0.08)',
                                boxShadow: ach.isUnlocked
                                    ? `0 0 12px ${rarityColor}33`
                                    : 'none',
                                opacity: ach.isUnlocked ? 1 : 0.45,
                                transition: 'all 0.25s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '1.8rem', filter: ach.isUnlocked ? 'none' : 'grayscale(100%)' }}>
                                        {ach.icon}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            border: `1px solid ${rarityColor}`,
                                            color: rarityColor,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {getRarityLabel(ach.rarity)}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>
                                    {title}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#bbbbbb', lineHeight: '1.3' }}>
                                    {desc}
                                </div>
                            </div>

                            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem' }}>
                                {ach.isUnlocked ? (
                                    <span style={{ color: '#39ff14', fontWeight: 600 }}>
                                        ✅ {t('achievements.unlocked')}
                                    </span>
                                ) : (
                                    <span style={{ color: '#777777' }}>
                                        🔒 {t('achievements.locked')}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};