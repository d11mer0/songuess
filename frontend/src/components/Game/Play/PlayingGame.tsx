import { useState, useEffect } from 'react';
import AnswerOptions from './PlayingGame/AnswerOptions';
import AudioPlayer from './PlayingGame/AudioPlayer';
import RoundResult from './PlayingGame/RoundResult';
import TotalScore from './PlayingGame/TotalScore';
import PlayersRoundResults from './PlayingGame/PlayersRoundResults';
import TypeInAnswer from './PlayingGame/TypeInAnswer';
import HeardleControls, { HEARDLE_TIERS } from './PlayingGame/HeardleControls';
import NeonVisualizer from './PlayingGame/NeonVisualizer';
import RoundTimer from './PlayingGame/RoundTimer';

import { useAppSelector } from '../../../store/hooks';
import { selectTrackInfo, selectCurrentRoom } from '../../../store/gameplay/gameplaySelectors';
import Loader from '../../UI/Loader/Loader/Loader';
import styles from './PlayingGame.module.css';

type PlayingGameProps = {
    onSubmitAnswer: (option: string, snippetDurationUsed?: number) => void;
};

const PlayingGame = ({ onSubmitAnswer }: PlayingGameProps) => {
    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);

    const gameMode = currentRoom?.lobbyOptions?.gameMode || 'CLASSIC';
    const answerMode = currentRoom?.lobbyOptions?.answerMode || 'MULTIPLE_CHOICE';

    const [unlockedSeconds, setUnlockedSeconds] = useState<number>(1);
    const [hasAnswered, setHasAnswered] = useState<boolean>(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

    // Скидаємо стан при зміні раунду
    useEffect(() => {
        setUnlockedSeconds(1);
        setHasAnswered(false);
        setIsPlayingAudio(false);
    }, [trackInfo?.roundNumber]);

    const handleUnlockNext = () => {
        const currentIndex = HEARDLE_TIERS.indexOf(unlockedSeconds);
        if (currentIndex !== -1 && currentIndex < HEARDLE_TIERS.length - 1) {
            setUnlockedSeconds(HEARDLE_TIERS[currentIndex + 1]);
        }
    };

    const handleSubmit = (answer: string) => {
        setHasAnswered(true);
        onSubmitAnswer(answer, gameMode === 'HEARDLE' ? unlockedSeconds : undefined);
    };

    if (!currentRoom) return null;

    const currentTierIndex = HEARDLE_TIERS.indexOf(unlockedSeconds);
    const canUnlockMore = currentTierIndex < HEARDLE_TIERS.length - 1;

    return (
        <div className={styles.layout}>
            <div className={styles.leftCol}>
                <TotalScore />
            </div>
            <div className={styles.centerCol}>
                <div className={styles.playingWrapper}>
                    {trackInfo ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h1 className={styles.roundTitle}>Round №{trackInfo.roundNumber + 1}</h1>
                                {gameMode === 'DUEL' && (
                                    <div style={{
                                        background: 'linear-gradient(90deg, #ff007f, #7928ca)',
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        fontWeight: '700',
                                        fontSize: '13px',
                                        color: '#fff',
                                        letterSpacing: '1px'
                                    }}>
                                        ⚡ 1v1 BLITZ DUEL
                                    </div>
                                )}
                            </div>

                            <RoundTimer />

                            <NeonVisualizer isPlaying={isPlayingAudio} />

                            {gameMode === 'HEARDLE' && (
                                <HeardleControls
                                    unlockedSeconds={unlockedSeconds}
                                    onUnlockNext={handleUnlockNext}
                                    canUnlockMore={canUnlockMore}
                                    hasAnswered={hasAnswered}
                                />
                            )}

                            <div className={styles.section}>
                                {answerMode === 'TYPE_IN' ? (
                                    <TypeInAnswer onSubmit={handleSubmit} />
                                ) : (
                                    <AnswerOptions onSubmit={handleSubmit} />
                                )}

                                <RoundResult />
                                <PlayersRoundResults />

                                <div className={styles.audioControl}>
                                    <AudioPlayer
                                        maxPlayDuration={gameMode === 'HEARDLE' ? unlockedSeconds : undefined}
                                        onPlayingChange={setIsPlayingAudio}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <Loader text="Next round is loading..." />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayingGame;