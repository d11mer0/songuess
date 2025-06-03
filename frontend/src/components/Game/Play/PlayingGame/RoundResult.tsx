import { FC } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';

interface RoundResultProps {
    result: {
        answer: string;
        correctAnswer: string;
        timeTaken: number;
        isCorrect: boolean;
    };
}

const RoundResult = () => {
    const result = useAppSelector(selectRoundResult);
    
    if(!result) return null;
    
    return (
        <div style={{ marginTop: '16px' }}>
            <p>Правильна відповідь: <strong>{result.correctAnswer}</strong></p>
            <p>
                Твоя відповідь:{' '}
                {result.isCorrect ? '✅ Правильно!' : '❌ Неправильно'}
            </p>
            <p>Використано часу: {result.timeTaken}</p>
        </div>
    );
};

export default RoundResult;