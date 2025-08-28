import styles from './Confetti.module.css';

const Confetti = () => (
    <div className={styles.confettiWrapper}>
        {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className={styles.confetti} style={{ "--i": i } as React.CSSProperties}></div>
        ))}
    </div>
);

export default Confetti;