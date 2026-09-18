import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuestLoginMutation } from '../../store/api/authApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { socketEmitter, socketHandlers, socketInstance } from '../../services/socket';
import { useSocketConnection } from '../../hooks/common/useSocketConnection';
import { setCurrentRoom } from '../../store/gameplay/gameplaySlice';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { useTranslation } from '../../i18n/LanguageContext';
import { RoomState } from '../../types/roomTypes';
import confetti from 'canvas-confetti';
import styles from './PartyControllerPage.module.css';

const BUTTON_THEMES = [
    { label: 'A', shape: '▲', className: styles.btnRed, color: '#e63946' },
    { label: 'B', shape: '◆', className: styles.btnBlue, color: '#0077b6' },
    { label: 'C', shape: '●', className: styles.btnYellow, color: '#e09f3e' },
    { label: 'D', shape: '■', className: styles.btnGreen, color: '#2a9d8f' },
];

interface RoundPayload {
    roundNumber: number;
    options: string[];
    startedAt: number;
}

interface RoundResultPayload {
    correctAnswer: string;
    results: Array<{
        playerId: number;
        answer: string;
        score: number;
        streak: number;
        totalScore: number;
    }>;
}

const PartyControllerPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state) => state.user);
    const isAuthenticated = Boolean(user && user.id);
    const currentRoom = useAppSelector(selectCurrentRoom);

    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState(code || '');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [guestLogin, { isLoading: isLoggingIn }] = useGuestLoginMutation();

    const [currentRound, setCurrentRound] = useState<RoundPayload | null>(null);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [roundResult, setRoundResult] = useState<RoundResultPayload | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);

    useSocketConnection();

    // Join room when authenticated and room code available
    useEffect(() => {
        if (isAuthenticated && roomCode && !currentRoom && !joinError) {
            socketInstance.connect();
            socketEmitter.emit('joinRoom', { id: roomCode.trim().toUpperCase() });
        }
    }, [isAuthenticated, roomCode, currentRoom, joinError]);

    // Socket events for party controller
    useEffect(() => {
        const handleJoinedRoom = (room: any) => {
            if (room) {
                dispatch(setCurrentRoom(room));
                setJoinError(null);
            } else {
                setJoinError(t('party.roomNotFoundOrClosed'));
            }
        };

        const handleRoundStarted = (payload: RoundPayload) => {
            setCurrentRound(payload);
            setSelectedOptionIndex(null);
            setIsAnswerSubmitted(false);
            setRoundResult(null);
        };

        const handleReconnectToRound = (payload: any) => {
            if (!payload) return;
            setCurrentRound({
                roundNumber: payload.roundNumber,
                options: payload.options,
                startedAt: payload.startedAt,
            });
            if (payload.answer) {
                setIsAnswerSubmitted(true);
                const idx = payload.options.indexOf(payload.answer);
                setSelectedOptionIndex(idx >= 0 ? idx : null);
            } else {
                setIsAnswerSubmitted(false);
                setSelectedOptionIndex(null);
            }
            setRoundResult(null);
        };

        const handleRoundResult = (payload: RoundResultPayload) => {
            setRoundResult(payload);
        };

        const handleGameFinished = () => {
            setIsGameFinished(true);
            try {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                });
            } catch {}
        };

        const handleGameRestarted = (room: any) => {
            if (room) {
                dispatch(setCurrentRoom(room));
            }
            setIsGameFinished(false);
            setCurrentRound(null);
            setRoundResult(null);
            setIsAnswerSubmitted(false);
            setSelectedOptionIndex(null);
            setJoinError(null);
        };

        socketHandlers.on('joinedRoom', handleJoinedRoom);
        socketHandlers.on('currentRoom', handleJoinedRoom);
        socketHandlers.on('gameStarted', handleJoinedRoom);
        socketHandlers.on('roundStarted', handleRoundStarted);
        socketHandlers.on('reconnectToRound', handleReconnectToRound);
        socketHandlers.on('roundResult', handleRoundResult);
        socketHandlers.on('gameFinished', handleGameFinished);
        socketHandlers.on('gameEnded', handleGameFinished);
        socketHandlers.on('gameRestarted', handleGameRestarted);

        return () => {
            socketHandlers.off('joinedRoom');
            socketHandlers.off('currentRoom');
            socketHandlers.off('gameStarted');
            socketHandlers.off('roundStarted');
            socketHandlers.off('reconnectToRound');
            socketHandlers.off('roundResult');
            socketHandlers.off('gameFinished');
            socketHandlers.off('gameEnded');
            socketHandlers.off('gameRestarted');
        };
    }, [dispatch, t]);

    const handleGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = nickname.trim();
        const targetCode = roomCode.trim().toUpperCase();
        if (!trimmedName || !targetCode) return;

        setJoinError(null);
        try {
            const res = await guestLogin({ nickname: trimmedName }).unwrap();
            if (res?.accessToken) {
                localStorage.setItem('accessToken', res.accessToken);
            }
            socketInstance.connect();
            socketEmitter.emit('joinRoom', { id: targetCode });
        } catch (err: any) {
            console.error('Guest login failed', err);
            const msg = err?.data?.message;
            const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || 'Помилка входу');
            setJoinError(displayMsg);
        }
    };

    const handleAnswerClick = useCallback((index: number) => {
        if (isAnswerSubmitted || !currentRound || !currentRoom) return;

        try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(40);
            }
        } catch {}

        setSelectedOptionIndex(index);
        setIsAnswerSubmitted(true);

        const answer = currentRound.options[index];
        socketEmitter.emit('submitAnswer', {
            roomId: currentRoom.id,
            roundNumber: currentRound.roundNumber,
            answer,
            snippetDurationUsed: 0,
        });
    }, [isAnswerSubmitted, currentRound, currentRoom]);

    // View 1: Guest Login / Enter Code
    if (!isAuthenticated) {
        return (
            <div className={styles.container}>
                <div className={styles.authCard}>
                    <div className={styles.authIcon}>🎮</div>
                    <h1 className={styles.authTitle}>{t('party.controllerTitle')}</h1>
                    <p className={styles.authSubtitle}>{t('party.enterNickname')}</p>

                    <form onSubmit={handleGuestSubmit} className={styles.inputGroup}>
                        {!code && (
                            <input
                                className={styles.input}
                                placeholder={t('party.roomCodePlaceholder')}
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                maxLength={8}
                                required
                            />
                        )}
                        <input
                            className={styles.input}
                            placeholder={t('party.nicknamePlaceholder')}
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={16}
                            autoFocus
                            required
                        />
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isLoggingIn || !nickname.trim() || !roomCode.trim()}
                        >
                            {isLoggingIn ? '...' : t('party.joinGameBtn')}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // View 1.5: Error joining room
    if (joinError) {
        return (
            <div className={styles.container}>
                <div className={styles.authCard}>
                    <div className={styles.authIcon}>⚠️</div>
                    <h1 className={styles.authTitle}>#{roomCode}</h1>
                    <p className={styles.authSubtitle} style={{ color: '#ff6b6b', lineHeight: 1.5 }}>
                        {joinError}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', width: '100%' }}>
                        <button
                            type="button"
                            className={styles.submitBtn}
                            onClick={() => {
                                setJoinError(null);
                                socketInstance.connect();
                                socketEmitter.emit('joinRoom', { id: roomCode.trim().toUpperCase() });
                            }}
                        >
                            🔄 {t('party.tryAgain')}
                        </button>
                        <button
                            type="button"
                            className={styles.submitBtn}
                            style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                            onClick={() => {
                                setJoinError(null);
                                setRoomCode('');
                                navigate('/play');
                            }}
                        >
                            ✏️ {t('party.enterDifferentCode')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // View 1.6: Authenticated but waiting for room confirmation
    if (isAuthenticated && !currentRoom) {
        return (
            <div className={styles.container}>
                <div className={styles.lobbyCard}>
                    <div className={styles.roomBadge}>#{roomCode}</div>
                    {user?.avatar && (
                        <img
                            src={user.avatar}
                            alt={user.login}
                            className={styles.playerAvatar}
                        />
                    )}
                    <h2 className={styles.playerName}>{user?.login}</h2>

                    <div className={styles.waitingPrompt}>
                        <div className={styles.waitingText}>{t('party.connectingToRoom')}</div>
                    </div>
                </div>
            </div>
        );
    }

    // View 2: Round Result
    if (roundResult) {
        const myResult = roundResult.results.find((r) => r.playerId === user?.id);
        const isCorrect = myResult ? myResult.score > 0 : false;
        const sorted = [...roundResult.results].sort((a, b) => b.totalScore - a.totalScore);
        const myRank = sorted.findIndex((r) => r.playerId === user?.id) + 1;

        return (
            <div
                className={`${styles.container} ${styles.resultScreen} ${
                    isCorrect ? styles.resultCorrect : styles.resultIncorrect
                }`}
            >
                <div className={styles.resultEmoji}>{isCorrect ? '🎉' : '❌'}</div>
                <h2 className={styles.resultTitle}>
                    {isCorrect ? t('party.correct') : t('party.incorrect')}
                </h2>
                {myResult && (
                    <div className={styles.resultPoints}>
                        +{myResult.score} {t('gameplay.points')}
                        {Boolean(myResult.streak && myResult.streak > 1) && ` 🔥 x${myResult.streak}`}
                    </div>
                )}
                {myRank > 0 && (
                    <div className={styles.resultRank}>
                        {t('party.yourRank')}: #{myRank}
                    </div>
                )}
            </div>
        );
    }

    // View 3: Active Round (The 4-Button Gamepad)
    if (currentRound) {
        return (
            <div className={styles.container}>
                <div className={styles.gamepadContainer}>
                    <div className={styles.gamepadHeader}>
                        <span>{user?.login}</span>
                        <span>
                            {t('gameplay.roundNumber')} #{currentRound.roundNumber + 1}
                        </span>
                    </div>

                    <div className={styles.gamepadGrid}>
                        {BUTTON_THEMES.map((theme, idx) => {
                            const isSelected = selectedOptionIndex === idx;
                            const isDimmed = isAnswerSubmitted && !isSelected;

                            return (
                                <button
                                    key={idx}
                                    className={`${styles.gamepadBtn} ${theme.className} ${
                                        isSelected ? styles.btnSelected : ''
                                    } ${isDimmed ? styles.btnDimmed : ''}`}
                                    onClick={() => handleAnswerClick(idx)}
                                    disabled={isAnswerSubmitted}
                                    style={{ '--btn-glow': theme.color } as React.CSSProperties}
                                >
                                    <span className={styles.btnShape}>{theme.shape}</span>
                                    <span className={styles.btnLabel}>{theme.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {isAnswerSubmitted && (
                        <div className={styles.submittedBanner}>
                            <div className={styles.submittedIcon}>✨</div>
                            <div className={styles.submittedText}>
                                {t('party.answerSubmitted')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // View 4: Lobby Waiting Screen
    const isCreating = currentRoom?.state === RoomState.CREATING;

    return (
        <div className={styles.container}>
            <div className={styles.lobbyCard}>
                <div className={styles.roomBadge}>#{roomCode}</div>
                {user?.avatar && (
                    <img
                        src={user.avatar}
                        alt={user.login}
                        className={styles.playerAvatar}
                    />
                )}
                <h2 className={styles.playerName}>{user?.login}</h2>

                <div className={styles.waitingPrompt}>
                    <div className={styles.waitingText}>
                        {isCreating ? t('party.hostSelectingTracks') : t('party.waitingInLobby')}
                    </div>
                    <p className={styles.tvHint}>
                        {isCreating ? t('party.prepareForRound') : t('party.instructionsWatchTv')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PartyControllerPage;
