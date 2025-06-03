import { useState, useEffect } from 'react';

import { socketEmitter } from '../../../../services/socket/socketEmitter';
import { useAppSelector } from '../../../../store/hooks';
import {
    selectCurrentRoom,
    selectTrackInfo,
    selectInitialAnswer,
} from '../../../../store/gameplay/gameplaySelectors';

type Props = {
    onSubmit: (option: string) => void;
};

const AnswerOptions = ({ onSubmit }: Props) => {

    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);
    const initialAnswer = useAppSelector(selectInitialAnswer);
    
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
        <div>
            <h1>Варіанти більше:</h1>
            {trackInfo.options.map((value, index) => (
                <button
                    key={index}
                    onClick={() => handleOptionClick(value)}
                    disabled={selectedOption !== null}
                    style={{
                        background: selectedOption === value ? 'lightblue' : undefined,
                        marginBottom: '8px',
                        display: 'block',
                        cursor: selectedOption ? 'not-allowed' : 'pointer',
                    }}
                >
                    {value}
                </button>
            ))}
        </div>
    );
};

export default AnswerOptions;