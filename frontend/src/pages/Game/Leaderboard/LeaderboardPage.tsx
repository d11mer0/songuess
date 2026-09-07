import React, { useState } from 'react';
import { useGetLeaderboardQuery } from '../../../store/api/leaderboardApi';
import { useAppSelector } from '../../../store/hooks';
import styles from './LeaderboardPage.module.css';
import { useTranslation } from '../../../i18n/LanguageContext';

const LeaderboardPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAppSelector((state) => state.user);
    const [period, setPeriod] = useState<'all_time' | 'weekly' | 'monthly'>('all_time');
    const [genre, setGenre] = useState<string>('all');

    const GENRES = [
        { id: 'all', label: t('genres.all') },
        { id: 'rock', label: t('genres.rock') },
        { id: 'pop', label: t('genres.pop') },
        { id: 'hiphop', label: t('genres.hiphop') },
        { id: 'electronic', label: t('genres.electronic') },
    ];

    const { data, isLoading } = useGetLeaderboardQuery({ period, genre });

    const entries = data?.entries || [];
    const top1 = entries[0];
    const top2 = entries[1];
    const top3 = entries[2];

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t('leaderboard.title')}</h1>
            <p className={styles.subtitle}>{t('leaderboard.subtitle')}</p>

            {/* Періоди */}
            <div className={styles.periodTabs}>
                <button
                    className={`${styles.tabBtn} ${period === 'all_time' ? styles.active : ''}`}
                    onClick={() => setPeriod('all_time')}
                >
                    {t('leaderboard.allTime')}
                </button>
                <button
                    className={`${styles.tabBtn} ${period === 'weekly' ? styles.active : ''}`}
                    onClick={() => setPeriod('weekly')}
                >
                    {t('leaderboard.weekly')}
                </button>
                <button
                    className={`${styles.tabBtn} ${period === 'monthly' ? styles.active : ''}`}
                    onClick={() => setPeriod('monthly')}
                >
                    {t('leaderboard.monthly')}
                </button>
            </div>

            {/* Жанри */}
            <div className={styles.genreList}>
                {GENRES.map((g) => (
                    <button
                        key={g.id}
                        className={`${styles.genrePill} ${genre === g.id ? styles.active : ''}`}
                        onClick={() => setGenre(g.id)}
                    >
                        {g.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <h3>{t('common.loading')}</h3>
            ) : entries.length === 0 ? (
                <p>{t('leaderboard.emptyCategory')}</p>
            ) : (
                <>
                    {/* П'єдестал пошани Топ-3 */}
                    {top1 && (
                        <div className={styles.podiumContainer}>
                            {top2 && (
                                <div className={`${styles.podiumCard} ${styles.podium2}`}>
                                    <div className={styles.podiumTrophy}>🥈</div>
                                    <img
                                        src={top2.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                        alt={top2.login}
                                        className={styles.podiumAvatar}
                                        style={{
                                            border: top2.isPremium ? '3px solid #ffd700' : 'none',
                                            boxShadow: top2.isPremium ? '0 0 12px rgba(255, 215, 0, 0.6)' : 'none',
                                        }}
                                    />
                                    <div
                                        className={styles.podiumName}
                                        style={{
                                            color: top2.nameColor || (top2.isPremium ? '#ffd700' : '#ffffff'),
                                            textShadow: top2.isPremium ? '0 0 8px rgba(255, 215, 0, 0.6)' : 'none',
                                        }}
                                    >
                                        {top2.isPremium && '⭐ '}{top2.login}
                                    </div>
                                    <div className={styles.podiumScore}>{top2.totalScore} {t('common.pts')}</div>
                                </div>
                            )}

                            <div className={`${styles.podiumCard} ${styles.podium1}`}>
                                <div className={styles.podiumTrophy}>🥇</div>
                                <img
                                    src={top1.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                    alt={top1.login}
                                    className={styles.podiumAvatar}
                                    style={{
                                        border: top1.isPremium ? '3px solid #ffd700' : 'none',
                                        boxShadow: top1.isPremium ? '0 0 16px rgba(255, 215, 0, 0.8)' : 'none',
                                    }}
                                />
                                <div
                                    className={styles.podiumName}
                                    style={{
                                        color: top1.nameColor || (top1.isPremium ? '#ffd700' : '#ffffff'),
                                        textShadow: top1.isPremium ? '0 0 10px rgba(255, 215, 0, 0.7)' : 'none',
                                    }}
                                >
                                    {top1.isPremium && '⭐ '}{top1.login}
                                </div>
                                <div className={styles.podiumScore}>{top1.totalScore} {t('common.pts')}</div>
                            </div>

                            {top3 && (
                                <div className={`${styles.podiumCard} ${styles.podium3}`}>
                                    <div className={styles.podiumTrophy}>🥉</div>
                                    <img
                                        src={top3.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                        alt={top3.login}
                                        className={styles.podiumAvatar}
                                        style={{
                                            border: top3.isPremium ? '3px solid #ffd700' : 'none',
                                            boxShadow: top3.isPremium ? '0 0 12px rgba(255, 215, 0, 0.6)' : 'none',
                                        }}
                                    />
                                    <div
                                        className={styles.podiumName}
                                        style={{
                                            color: top3.nameColor || (top3.isPremium ? '#ffd700' : '#ffffff'),
                                            textShadow: top3.isPremium ? '0 0 8px rgba(255, 215, 0, 0.6)' : 'none',
                                        }}
                                    >
                                        {top3.isPremium && '⭐ '}{top3.login}
                                    </div>
                                    <div className={styles.podiumScore}>{top3.totalScore} {t('common.pts')}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Позиція поточного користувача */}
                    {data?.currentUserRank && (
                        <div className={styles.myRankCard}>
                            <div className={styles.myRankInfo}>
                                <span className={styles.myRankBadge}>#{data.currentUserRank.rank}</span>
                                <div>
                                    <strong style={{ color: data.currentUserRank.nameColor || (data.currentUserRank.isPremium ? '#ffd700' : '#ffffff') }}>
                                        {data.currentUserRank.isPremium && '⭐ '}
                                        {data.currentUserRank.login} ({t('leaderboard.myRank')})
                                    </strong>
                                    <div>{data.currentUserRank.gamesPlayed} ігор</div>
                                </div>
                            </div>
                            <div className={styles.podiumScore}>
                                {data.currentUserRank.totalScore} {t('common.pts')}
                            </div>
                        </div>
                    )}

                    {/* Повна таблиця */}
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{t('leaderboard.player')}</th>
                                    <th>{t('leaderboard.score')}</th>
                                    <th>{t('leaderboard.highScore')}</th>
                                    <th>{t('leaderboard.streak')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => {
                                    const isMe = user?.id === entry.userId;
                                    const nameColor = entry.nameColor || (entry.isPremium ? '#ffd700' : '#ffffff');
                                    return (
                                        <tr key={entry.userId} className={isMe ? styles.highlightUser : ''}>
                                            <td>
                                                <span className={`${styles.rankNumber} ${entry.rank <= 3 ? styles.rankTop : ''}`}>
                                                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <img
                                                        src={entry.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                                        alt={entry.login}
                                                        className={styles.tableAvatar}
                                                        style={{
                                                            border: entry.isPremium ? '2px solid #ffd700' : 'none',
                                                        }}
                                                    />
                                                    <span
                                                        style={{
                                                            color: nameColor,
                                                            textShadow: entry.isPremium ? `0 0 8px ${nameColor}88` : 'none',
                                                            fontWeight: entry.isPremium ? 700 : 500,
                                                        }}
                                                    >
                                                        {entry.isPremium && '⭐ '}
                                                        {entry.login} {isMe ? '(Ви)' : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.scoreCell}>{entry.totalScore}</td>
                                            <td>{entry.highScore}</td>
                                            <td className={styles.streakCell}>
                                                {entry.dailyStreak > 0 ? `🔥 x${entry.dailyStreak}` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default LeaderboardPage;