import { FaTrophy } from 'react-icons/fa';
import styles from '../GameFinished.module.css';
import PodiumCard from './FinalScores/PodiumCard';
import PlayerCard from './FinalScores/PlayerCard';

interface Player {
    id: number;
    login: string;
    avatar: string | null;
    totalScore?: number;
}

interface FinalScoresProps {
    players: Player[];
    userId?: number;
}

const FinalScores = ({ players, userId }: FinalScoresProps) => {
    const sortedPlayers = [...players].sort(
        (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)
    );

    const podiumPlayers = sortedPlayers.slice(0, 3);
    const otherPlayers = sortedPlayers.slice(3);

    return (
        <section className={styles.gameFinishedSection}>
            <h3 className={styles.sectionTitle}>
                <FaTrophy className={styles.sectionIcon} /> Final Scores
            </h3>
            <div className={styles.playerList}>
                <div className={styles.podium}>
                    {podiumPlayers.map((player) => {
                        const rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
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

                <div className={styles.playerList}>
                    {otherPlayers?.map((player, i) => (
                        <PlayerCard 
                            key={player.id} 
                            player={player} 
                            rank={i + 4} 
                            isYou={player.id === userId} 
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FinalScores;