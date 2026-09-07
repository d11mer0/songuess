import React from 'react';
import styles from './Confetti.module.css';

const Confetti: React.FC = () => {
    return (
        <div className={styles.confettiWrapper}>
            {Array.from({ length: 70 }).map((_, i) => (
                <div
                    key={i}
                    className={styles.confetti}
                    style={{
                        left: `${(i * 1.45) % 100}%`,
                        animationDelay: `${(i * 0.08) % 3}s`,
                        animationDuration: `${2.5 + ((i * 0.15) % 2)}s`,
                    }}
                />
            ))}
        </div>
    );
};

export default Confetti;