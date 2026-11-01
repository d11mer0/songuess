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

import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
    selectTrackInfo,
    selectCurrentRoom,
    selectRoundResult,
    selectHeardleUnlockedTier,
    selectInitialAnswer
} from '../../../store/gameplay/gameplaySelectors';
import { setHeardleUnlockedTier } from '../../../store/gameplay/gameplaySlice';
import { socketEmitter } from '../../../services/socket';
import { useTranslation } from '../../../i18n/LanguageContext';
import Loader from '../../UI/Loader/Loader/Loader';
import styles from './PlayingGame.module.css';

type PlayingGameProps = {
    onSubmitAnswer: (option: string, snippetDurationUsed?: number) => void;
};

const PlayingGame = ({ onSubmitAnswer }: PlayingGameProps) => {
    const { t } = useTranslation();
    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);
    const roundResult = useAppSelector(selectRoundResult);

    const gameMode = currentRoom?.lobbyOptions?.gameMode || 'CLASSIC';
    const answerMode = currentRoom?.lobbyOptions?.answerMode || 'MULTIPLE_CHOICE';

    const dispatch = useAppDispatch();
    const heardleUnlockedTier = useAppSelector(selectHeardleUnlockedTier);
    const initialAnswer = useAppSelector(selectInitialAnswer);

    const isHeardle = gameMode === 'HEARDLE';

    const heardleStorageKey = currentRoom && trackInfo !== null
        ? `songuess_heardle_${currentRoom.id}_${trackInfo.roundNumber}`
        : null;
    const answeredStorageKey = currentRoom && trackInfo !== null
        ? `songuess_answered_${currentRoom.id}_${trackInfo.roundNumber}`
        : null;

    const [unlockedSeconds, setUnlockedSeconds] = useState<number>(() => {
        if (heardleStorageKey) {
            const saved = sessionStorage.getItem(heardleStorageKey);
            const parsed = saved ? parseInt(saved, 10) : NaN;
            if (HEARDLE_TIERS.includes(parsed)) return parsed;
        }
        return heardleUnlockedTier || 1;
    });

    const [hasAnswered, setHasAnswered] = useState<boolean>(() => {
        if (initialAnswer) return true;
        if (answeredStorageKey) return sessionStorage.getItem(answeredStorageKey) === 'true';
        return false;
    });

    const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
    const [replayTrigger, setReplayTrigger] = useState<number>(0);

    // Синхронізація з Redux heardleUnlockedTier (наприклад, при отриманні reconnectToRound)
    useEffect(() => {
        if (heardleUnlockedTier && heardleUnlockedTier > unlockedSeconds) {
            setUnlockedSeconds(heardleUnlockedTier);
            if (heardleStorageKey) {
                sessionStorage.setItem(heardleStorageKey, String(heardleUnlockedTier));
            }
        }
    }, [heardleUnlockedTier, heardleStorageKey, unlockedSeconds]);

    // Синхронізація з initialAnswer
    useEffect(() => {
        if (initialAnswer) {
            setHasAnswered(true);
            if (answeredStorageKey) {
                sessionStorage.setItem(answeredStorageKey, 'true');
            }
        }
    }, [initialAnswer, answeredStorageKey]);

    const roundDurationSec = trackInfo?.endsAt && trackInfo?.startedAt
        ? Math.max(1, Math.round((trackInfo.endsAt - trackInfo.startedAt) / 1000))
        : (currentRoom?.lobbyOptions?.roundDuration || 25);

    const effectiveMaxDuration = isHeardle
        ? unlockedSeconds
        : roundDurationSec;

    // Скидаємо/відновлюємо стан при зміні раунду
    useEffect(() => {
        if (trackInfo?.roundNumber !== undefined) {
            let tier = 1;
            if (heardleStorageKey) {
                const saved = sessionStorage.getItem(heardleStorageKey);
                const parsed = saved ? parseInt(saved, 10) : NaN;
                if (HEARDLE_TIERS.includes(parsed)) {
                    tier = parsed;
                }
            } else if (heardleUnlockedTier) {
                tier = heardleUnlockedTier;
            }
            setUnlockedSeconds(tier);

            const answered = Boolean(initialAnswer) || (answeredStorageKey ? sessionStorage.getItem(answeredStorageKey) === 'true' : false);
            setHasAnswered(answered);

            // Чистимо ключі попередніх раундів цієї кімнати для збереження пам'яті
            if (currentRoom?.id && trackInfo.roundNumber > 0) {
                for (let r = 0; r < trackInfo.roundNumber; r++) {
                    sessionStorage.removeItem(`songuess_heardle_${currentRoom.id}_${r}`);
                    sessionStorage.removeItem(`songuess_answered_${currentRoom.id}_${r}`);
                }
            }
        }
    }, [trackInfo?.roundNumber, heardleStorageKey, answeredStorageKey, initialAnswer, heardleUnlockedTier, currentRoom?.id]);

    const handleUnlockNext = () => {
        const currentIndex = HEARDLE_TIERS.indexOf(unlockedSeconds);
        if (currentIndex !== -1 && currentIndex < HEARDLE_TIERS.length - 1) {
            const nextTier = HEARDLE_TIERS[currentIndex + 1];
            setUnlockedSeconds(nextTier);
            dispatch(setHeardleUnlockedTier(nextTier));
            if (heardleStorageKey) {
                sessionStorage.setItem(heardleStorageKey, String(nextTier));
            }
            if (currentRoom?.id && trackInfo?.roundNumber !== undefined) {
                socketEmitter.emit('unlockHeardleSnippet', {
                    roomId: currentRoom.id,
                    roundNumber: trackInfo.roundNumber,
                    snippetDuration: nextTier,
                });
            }
        }
    };

    const handleSubmit = (answer: string) => {
        setHasAnswered(true);
        if (answeredStorageKey) {
            sessionStorage.setItem(answeredStorageKey, 'true');
        }
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
                                <h1 className={styles.roundTitle}>{t('gameplay.round')} №{trackInfo.roundNumber + 1}</h1>
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
                                        {t('gameplay.blitzDuel')}
                                    </div>
                                )}
                            </div>

                            <RoundTimer />

                            <NeonVisualizer isPlaying={isPlayingAudio && !roundResult} />

                            {gameMode === 'HEARDLE' && (
                                <HeardleControls
                                    unlockedSeconds={unlockedSeconds}
                                    onUnlockNext={handleUnlockNext}
                                    onReplay={() => setReplayTrigger((prev) => prev + 1)}
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
                                        maxPlayDuration={effectiveMaxDuration}
                                        isHeardle={isHeardle}
                                        replayTrigger={replayTrigger}
                                        onPlayingChange={setIsPlayingAudio}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <Loader text={t('gameplay.nextRoundLoading')} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayingGame;