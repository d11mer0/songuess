import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import {
    selectCurrentRoom,
    selectTrackInfo,
    selectInitialAnswer,
} from '../../../../store/gameplay/gameplaySelectors';

import { FaMusic } from 'react-icons/fa';
import { selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import styles from '../PlayingGame.module.css'
type Props = {
    onSubmit: (option: string) => void;
};

const AnswerOptions = ({ onSubmit }: Props) => {

    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);
    const initialAnswer = useAppSelector(selectInitialAnswer);
    const result = useAppSelector(selectRoundResult);

    const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return;
        setSelectedOption(option);
        onSubmit(option);
    };

    useEffect(() => {
        if (trackInfo?.preview) {
            setSelectedOption(initialAnswer ?? null);
        }
    }, [trackInfo, initialAnswer]);

    if (!currentRoom || !trackInfo) return null;

    return (
        <>
            <h1><FaMusic className={styles.icon} /> Guess the Track</h1>
            <div className={styles.optionsGrid}>
                {trackInfo.options.map((value, index) => {
                    const isCorrect = result?.correctAnswer === value;
                    const isSelected = selectedOption === value;
                    const showAsCorrect = selectedOption && isCorrect;
                    const showAsAutoReveal = !selectedOption && isCorrect;
                    const isWaitingForOthers = selectedOption && !result;

                    const buttonClass = [
                        styles.answerButton,
                        showAsCorrect || showAsAutoReveal ? styles.correct : '',
                        isWaitingForOthers && isSelected ? styles.waiting : '',
                        !isWaitingForOthers && isSelected && !isCorrect ? styles.incorrect : ''
                    ].join(' ');

                    return (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(value)}
                            disabled={!!selectedOption || !!result}
                            className={buttonClass}
                        >
                            {value}
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default AnswerOptions;