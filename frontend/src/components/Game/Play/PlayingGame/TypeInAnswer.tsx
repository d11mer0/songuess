import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import {
    selectCurrentRoom,
    selectTrackInfo,
    selectInitialAnswer,
    selectRoundResult,
} from '../../../../store/gameplay/gameplaySelectors';
import { FaKeyboard } from 'react-icons/fa';
import styles from './TypeInAnswer.module.css';

interface Props {
    onSubmit: (answer: string) => void;
}

const TypeInAnswer: React.FC<Props> = ({ onSubmit }) => {
    const [inputValue, setInputValue] = useState('');
    const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);
    const initialAnswer = useAppSelector(selectInitialAnswer);
    const result = useAppSelector(selectRoundResult);

    useEffect(() => {
        setInputValue('');
        setSubmittedAnswer(initialAnswer ?? null);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [trackInfo, initialAnswer]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed || submittedAnswer !== null) return;

        setSubmittedAnswer(trimmed);
        onSubmit(trimmed);
    };

    if (!currentRoom || !trackInfo) return null;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                <FaKeyboard className={styles.icon} /> Hardcore Mode: Введіть назву треку
            </h2>

            {!submittedAnswer && !result ? (
                <form onSubmit={handleSubmit} className={styles.inputWrapper}>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.textInput}
                        placeholder="Назва треку або виконавець..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={!!submittedAnswer || !!result}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={!inputValue.trim() || !!submittedAnswer || !!result}
                    >
                        Відповісти
                    </button>
                </form>
            ) : (
                <div className={styles.submittedAlert}>
                    Ваша відповідь: <strong>"{submittedAnswer}"</strong>
                    {!result && ' — очікуємо завершення раунду...'}
                </div>
            )}

            <div className={styles.hintText}>
                💡 Допускаються незначні друкарські помилки (Fuzzy Match). Натисніть Enter для відправки.
            </div>
        </div>
    );
};

export default TypeInAnswer;