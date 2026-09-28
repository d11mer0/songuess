import { useMemo } from 'react';
import { FaTrophy } from 'react-icons/fa';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from '../GameFinished.module.css';
import PodiumCard from './FinalScores/PodiumCard';
import PlayerCard from './FinalScores/PlayerCard';

interface Player {
    id: number;
    login: string;
    avatar: string | null;
    totalScore?: number;
    isPremium?: boolean;
    nameColor?: string;
}

interface FinalScoresProps {
    players: Player[];
    userId?: number;
}

const FinalScores = ({ players, userId }: FinalScoresProps) => {
    const { t } = useTranslation();

    const sortedPlayers = useMemo(
        () => [...players].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)),
        [players]
    );

    const podiumPlayers = useMemo(() => sortedPlayers.slice(0, 3), [sortedPlayers]);
    const otherPlayers = useMemo(() => sortedPlayers.slice(3), [sortedPlayers]);

    return (
        <section className={styles.gameFinishedSection}>
            <h3 className={styles.sectionTitle}>
                <FaTrophy className={styles.sectionIcon} /> {t('gameplay.finalScoresTitle')}
            </h3>

            {/* Podium for Top 1-3 */}
            <div
                className={`${styles.podium} ${
                    podiumPlayers.length === 2 ? styles.podiumDuel : ''
                } ${podiumPlayers.length === 1 ? styles.podiumSolo : ''}`}
            >
                {podiumPlayers.map((player) => {
                    const rank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;
                    return (
                        <PodiumCard
                            key={player.id}
                            player={player}
                            rank={rank}
                            isYou={player.id === userId}
                        />
                    );
                })}
            </div>

            {/* List for 4th+ players */}
            {otherPlayers.length > 0 && (
                <div className={styles.otherPlayersList}>
                    {otherPlayers.map((player, i) => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            rank={i + 4}
                            isYou={player.id === userId}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default FinalScores;