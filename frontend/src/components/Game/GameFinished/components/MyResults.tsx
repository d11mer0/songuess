import { FaChartLine } from 'react-icons/fa';
import styles from '../GameFinished.module.css';

interface Track {
    title: string;
    artistName?: string | null;
}

interface Result {
    roundNumber: number;
    track: Track;
    isCorrect: boolean;
}

interface MyResultsProps {
    results: Result[];
}

const MyResults = ({ results }: MyResultsProps) => {
    return (
        <section className={styles.gameFinishedSection}>
            <h3 className={styles.sectionTitle}><FaChartLine className={styles.sectionIcon} /> Your Performance</h3>
            <ul className={styles.resultsList}>
                {results.map((res, i) => (
                    <li key={i} className={styles.resultItem}>
                        <span className={styles.roundNumber}>#{res.roundNumber + 1}</span>
                        <div className={styles.trackBlock}>
                            <div className={styles.trackTitle}>{res.track.title}</div>
                            <div className={styles.trackArtist}>{res.track.artistName}</div>
                        </div>
                        <span className={`${styles.resultMark} ${res.isCorrect ? styles.correct : styles.incorrect}`}>
                            {res.isCorrect ? '✅' : '❌'}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default MyResults;
