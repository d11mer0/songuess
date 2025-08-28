import { useAppSelector } from '../../../../store/hooks';
import { selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import styles from '../PlayingGame.module.css';
import { FaCheckCircle, FaTimesCircle, FaRegClock } from 'react-icons/fa';

const RoundResult = () => {
    const result = useAppSelector(selectRoundResult);
    if(!result || !result.myResult) return null;
    
    const getStatus = () => {
        if (result.myResult.isCorrect) return { icon: <FaCheckCircle />, text: 'Correct!', className: styles.success };
        if (result.correctAnswer && !result.myResult.answer) return { icon: <FaRegClock />, text: 'No answer', className: styles.timeout };
        return { icon: <FaTimesCircle />, text: 'Incorrect', className: styles.failure };
    };

    const { icon, text, className } = getStatus();

    return (
        <div className={styles.roundResultWrapper}>
            <div className={`${styles.resultAnimation} ${className}`}>
                <span className={styles.resultIcon}>{icon}</span>
                {text}
            </div>
            {result.myResult.timeTaken > 0 && (
                <div className={styles.responseTime}>
                    Answered in {(result.myResult.timeTaken / 1000).toFixed(2)}s
                </div>
            )}
        </div>
    );
};

export default RoundResult;