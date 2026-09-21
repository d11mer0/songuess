import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGuestLoginMutation } from '../../store/api/authApi';
import { useLazyCheckRoomQuery } from '../../store/api/gameApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { socketEmitter, socketHandlers, socketInstance } from '../../services/socket';
import { useSocketConnection } from '../../hooks/common/useSocketConnection';
import { setCurrentRoom } from '../../store/gameplay/gameplaySlice';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { logout } from '../../store/users/userSlice';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../components/UI/Toast/ToastContext';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
import { RoomState } from '../../types/roomTypes';
import Loader from '../../components/UI/Loader/Loader/Loader';
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
    const [searchParams] = useSearchParams();
    const { t, setLanguage } = useTranslation();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state) => state.user);
    const isAuthenticated = Boolean(user && user.id);
    const currentRoom = useAppSelector(selectCurrentRoom);

    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState(code ? code.trim().toUpperCase() : '');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialCheckDone, setInitialCheckDone] = useState(!code);

    const [partyModeDisabledData, setPartyModeDisabledData] = useState<any | null>(null);
    const [autoLeaveSeconds, setAutoLeaveSeconds] = useState(20);

    const [guestLogin, { isLoading: isLoggingIn }] = useGuestLoginMutation();
    const [triggerCheckRoom, { isFetching: isCheckingRoom }] = useLazyCheckRoomQuery();

    const [currentRound, setCurrentRound] = useState<RoundPayload | null>(null);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [roundResult, setRoundResult] = useState<RoundResultPayload | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);

    useSocketConnection();

    // Synchronize language from URL parameter (e.g., from TV host QR code)
    useEffect(() => {
        const langParam = searchParams.get('lang');
        if (langParam === 'uk' || langParam === 'en') {
            setLanguage(langParam);
        }
    }, [searchParams, setLanguage]);

    // Verify room existence upfront when code is in URL
    useEffect(() => {
        if (code && code.trim()) {
            const targetCode = code.trim().toUpperCase();
            setRoomCode(targetCode);
            setJoinError(null);
            setInitialCheckDone(false);

            triggerCheckRoom(targetCode)
                .unwrap()
                .then((res) => {
                    if (!res.exists) {
                        setJoinError(t('party.roomNotFoundOrClosed'));
                    } else if (res.isFull) {
                        setJoinError(t('party.roomIsFull'));
                    } else {
                        setJoinError(null);
                    }
                })
                .catch(() => {
                    setJoinError(t('party.roomNotFoundOrClosed'));
                })
                .finally(() => {
                    setInitialCheckDone(true);
                });
        } else {
            setInitialCheckDone(true);
        }
    }, [code, triggerCheckRoom, t]);

    // Join room when authenticated, room code available, verified, and no error
    useEffect(() => {
        if (isAuthenticated && roomCode && !currentRoom && !joinError && initialCheckDone && !isCheckingRoom) {
            socketInstance.connect();
            socketEmitter.emit('joinRoom', { id: roomCode.trim().toUpperCase() });
        }
    }, [isAuthenticated, roomCode, currentRoom, joinError, initialCheckDone, isCheckingRoom]);

    // Host should never be stuck on the mobile controller; redirect them to the TV host view
    useEffect(() => {
        if (currentRoom && user?.id && currentRoom.leaderId && String(user.id) === String(currentRoom.leaderId)) {
            navigate(`/party/host/${currentRoom.id}`);
        }
    }, [currentRoom?.id, currentRoom?.leaderId, user?.id, navigate]);

    // Safe leave handler when party mode ends or user leaves
    const handleLeaveParty = useCallback((message?: string) => {
        setPartyModeDisabledData(null);
        const targetId = currentRoom?.id || roomCode;
        if (targetId) {
            socketEmitter.emit('leaveRoom', { id: targetId });
        }
        dispatch(setCurrentRoom(null));

        const isGuestUser = Boolean(
            user?.email?.endsWith('@guest.songuess.local') ||
            user?.email?.includes('@guest.')
        );
        if (isGuestUser) {
            dispatch(logout());
            if (message) {
                showToast(message, 'neutral');
            }
            navigate('/');
        } else {
            if (message) {
                showToast(message, 'neutral');
            }
            navigate('/game');
        }
    }, [currentRoom?.id, dispatch, navigate, roomCode, showToast, user?.email]);

    // Continue in regular mode when host switched off TV mode
    const handleContinueRegularMode = useCallback(() => {
        const targetRoom = partyModeDisabledData?.room || currentRoom;
        const targetId = partyModeDisabledData?.roomId || currentRoom?.id || roomCode;
        setPartyModeDisabledData(null);

        if (targetRoom?.state === RoomState.ADDING) {
            navigate('/game');
        } else {
            navigate(`/game/${targetId}`);
        }
    }, [currentRoom, navigate, partyModeDisabledData, roomCode]);

    // Auto-leave countdown timer when host disables party mode
    useEffect(() => {
        if (!partyModeDisabledData) return;

        setAutoLeaveSeconds(20);
        const interval = setInterval(() => {
            setAutoLeaveSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleLeaveParty();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [partyModeDisabledData, handleLeaveParty]);

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

        const handleGameStarted = (room: any) => {
            if (partyModeDisabledData) {
                // If game starts in regular mode and user has not chosen to continue,
                // safely leave to avoid stalling the host's round
                handleLeaveParty();
                return;
            }
            handleJoinedRoom(room);
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

        const handlePartyModeSwitched = (data: any) => {
            if (data?.room) {
                dispatch(setCurrentRoom(data.room));
            }
            if (data?.isPartyMode === false) {
                const isGuestUser = Boolean(
                    user?.email?.endsWith('@guest.songuess.local') ||
                    user?.email?.includes('@guest.')
                );
                if (isGuestUser) {
                    handleLeaveParty(t('party.guestKickedNotice'));
                    return;
                }
                // Host turned off TV mode! For registered users: smoothly transition to regular lobby
                const targetState = data?.room?.state || currentRoom?.state;
                const targetId = data?.roomId || data?.room?.id || currentRoom?.id || roomCode;
                if (targetState === RoomState.CREATING || targetState === RoomState.STARTED) {
                    navigate(`/game/${targetId}`);
                } else {
                    navigate('/game');
                }
            } else if (data?.isPartyMode === true) {
                // Host turned TV mode back on!
                setPartyModeDisabledData(null);
            }
        };

        const handleRoomDeleted = () => {
            dispatch(setCurrentRoom(null));
            navigate('/game');
        };

        const handlePlayerLeft = (room: any) => {
            if (!room) return;
            const wasKicked = !room.players?.some((p: any) => String(p.id) === String(user?.id));
            if (wasKicked) {
                dispatch(setCurrentRoom(null));
                const isGuestUser = Boolean(
                    user?.email?.endsWith('@guest.songuess.local') ||
                    user?.email?.includes('@guest.')
                );
                if (isGuestUser) {
                    dispatch(logout());
                    showToast(t('party.guestKickedNotice'), 'neutral');
                    navigate('/');
                } else {
                    navigate('/game');
                }
            } else {
                dispatch(setCurrentRoom(room));
            }
        };

        socketHandlers.on('joinedRoom', handleJoinedRoom);
        socketHandlers.on('currentRoom', handleJoinedRoom);
        socketHandlers.on('gameStarted', handleGameStarted);
        socketHandlers.on('roundStarted', handleRoundStarted);
        socketHandlers.on('reconnectToRound', handleReconnectToRound);
        socketHandlers.on('roundResult', handleRoundResult);
        socketHandlers.on('gameFinished', handleGameFinished);
        socketHandlers.on('gameEnded', handleGameFinished);
        socketHandlers.on('gameRestarted', handleGameRestarted);
        socketHandlers.on('partyModeSwitched', handlePartyModeSwitched);
        socketHandlers.on('roomDeleted', handleRoomDeleted);
        socketHandlers.on('playerLeft', handlePlayerLeft);

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
            socketHandlers.off('partyModeSwitched');
            socketHandlers.off('roomDeleted');
            socketHandlers.off('playerLeft');
        };
    }, [currentRoom?.players, dispatch, handleLeaveParty, navigate, partyModeDisabledData, roomCode, showToast, t, user]);

    // Ensure finished state is preserved if refreshed when game is ended
    useEffect(() => {
        if (currentRoom?.state === RoomState.ENDED) {
            setIsGameFinished(true);
        }
    }, [currentRoom?.state]);

    const handleGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = nickname.trim();
        const targetCode = roomCode.trim().toUpperCase();
        if (!trimmedName || !targetCode) return;

        setIsSubmitting(true);
        setJoinError(null);

        try {
            // 1. Verify room exists BEFORE creating a guest account
            const checkRes = await triggerCheckRoom(targetCode).unwrap();
            if (!checkRes.exists) {
                setJoinError(t('party.roomNotFoundOrClosed'));
                setIsSubmitting(false);
                return;
            }
            if (checkRes.isFull) {
                setJoinError(t('party.roomIsFull'));
                setIsSubmitting(false);
                return;
            }

            // 2. Perform guest login
            const res = await guestLogin({ nickname: trimmedName }).unwrap();
            if (res?.accessToken) {
                localStorage.setItem('accessToken', res.accessToken);
            }
            socketInstance.connect();
            socketEmitter.emit('joinRoom', { id: targetCode });
        } catch (err: any) {
            console.error('Guest login failed', err);
            const msg = err?.data?.message;
            const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || t('party.roomNotFoundOrClosed'));
            setJoinError(displayMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAuthUserSubmitCode = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetCode = roomCode.trim().toUpperCase();
        if (!targetCode) return;

        setIsSubmitting(true);
        setJoinError(null);

        try {
            const checkRes = await triggerCheckRoom(targetCode).unwrap();
            if (!checkRes.exists) {
                setJoinError(t('party.roomNotFoundOrClosed'));
                setIsSubmitting(false);
                return;
            }
            if (checkRes.isFull) {
                setJoinError(t('party.roomIsFull'));
                setIsSubmitting(false);
                return;
            }

            socketInstance.connect();
            socketEmitter.emit('joinRoom', { id: targetCode });
        } catch {
            setJoinError(t('party.roomNotFoundOrClosed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTryAgain = async () => {
        setJoinError(null);
        const targetCode = (roomCode || code || '').trim().toUpperCase();
        if (!targetCode) return;

        try {
            const res = await triggerCheckRoom(targetCode).unwrap();
            if (!res.exists) {
                setJoinError(t('party.roomNotFoundOrClosed'));
                return;
            }
            if (res.isFull) {
                setJoinError(t('party.roomIsFull'));
                return;
            }
            if (isAuthenticated) {
                socketInstance.connect();
                socketEmitter.emit('joinRoom', { id: targetCode });
            }
        } catch {
            setJoinError(t('party.roomNotFoundOrClosed'));
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

    const renderLanguageBar = () => (
        <div className={styles.topLanguageBar}>
            <LanguageSwitcher />
        </div>
    );

    // View 0: Initial Room Check / Verification Loading
    if ((!initialCheckDone || (isCheckingRoom && !joinError)) && code) {
        return (
            <div className={styles.container}>
                {renderLanguageBar()}
                <div className={styles.lobbyCard}>
                    <div className={styles.roomBadge}>#{code.toUpperCase()}</div>
                    <div className={styles.waitingPrompt} style={{ padding: '30px 20px' }}>
                        <Loader />
                        <div className={styles.waitingText} style={{ marginTop: '16px' }}>
                            {t('party.checkingRoom')}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // View 1: Error joining room (checked before View 2 so invalid rooms are not prompted for nickname)
    if (joinError) {
        return (
            <div className={styles.container}>
                {renderLanguageBar()}
                <div className={styles.authCard}>
                    <div className={styles.authIcon}>⚠️</div>
                    <h1 className={styles.authTitle}>#{roomCode || code}</h1>
                    <p className={styles.authSubtitle} style={{ color: '#ff6b6b', lineHeight: 1.5 }}>
                        {joinError}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', width: '100%' }}>
                        <button
                            type="button"
                            className={styles.submitBtn}
                            onClick={handleTryAgain}
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
                        <button
                            type="button"
                            className={styles.submitBtn}
                            style={{ background: 'transparent', border: 'none', color: '#9ca3af', textDecoration: 'underline' }}
                            onClick={() => navigate('/')}
                        >
                            🏠 {t('party.backHome')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // View 1.5: Party Mode Disabled by Host (Smart Transition Screen)
    if (partyModeDisabledData) {
        return (
            <div className={styles.container}>
                {renderLanguageBar()}
                <div className={styles.authCard}>
                    <div className={styles.authIcon}>📺</div>
                    <h1 className={styles.authTitle}>{t('party.modeDisabledTitle')}</h1>
                    <p className={styles.authSubtitle} style={{ lineHeight: 1.5, marginBottom: '16px' }}>
                        {t('party.modeDisabledDesc')}
                    </p>

                    <div className={styles.countdownBadge}>
                        ⏳ {t('party.autoLeaveCountdown', { seconds: autoLeaveSeconds })}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                        <button
                            type="button"
                            className={styles.submitBtn}
                            onClick={handleContinueRegularMode}
                        >
                            {t('party.continueInRegularMode')}
                        </button>
                        <button
                            type="button"
                            className={`${styles.submitBtn} ${styles.leaveBtn}`}
                            onClick={handleLeaveParty}
                        >
                            {t('party.leavePartyGame')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // View 2: Guest Login / Enter Code (only rendered when room is valid or not yet entered)
    if (!isAuthenticated) {
        return (
            <div className={styles.container}>
                {renderLanguageBar()}
                <div className={styles.authCard}>
                    <div className={styles.authLogoWrapper}>
                        <img src="/logo.png" alt="SonGuess" className={styles.authLogoImg} />
                    </div>
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
                            disabled={isSubmitting || isLoggingIn || !nickname.trim() || !roomCode.trim()}
                        >
                            {isSubmitting || isLoggingIn ? '...' : t('party.joinGameBtn')}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // View 2.5: Authenticated but no room code provided yet (visited /play directly)
    if (isAuthenticated && !currentRoom && !roomCode) {
        return (
            <div className={styles.container}>
                {renderLanguageBar()}
                <div className={styles.authCard}>
                    <div className={styles.authLogoWrapper}>
                        <img src="/logo.png" alt="SonGuess" className={styles.authLogoImg} />
                    </div>
                    <h1 className={styles.authTitle}>{t('party.controllerTitle')}</h1>
                    <p className={styles.authSubtitle}>{t('party.roomCodePlaceholder')}</p>

                    <form onSubmit={handleAuthUserSubmitCode} className={styles.inputGroup}>
                        <input
                            className={styles.input}
                            placeholder={t('party.roomCodePlaceholder')}
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={8}
                            autoFocus
                            required
                        />
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting || !roomCode.trim()}
                        >
                            {isSubmitting ? '...' : t('party.joinGameBtn')}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // View 2.6: Authenticated but waiting for room socket confirmation
    if (isAuthenticated && !currentRoom) {
        return (
            <div className={styles.container}>
                {renderLanguageBar()}
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

    // View: Game Finished / Podium Celebration Screen
    if (isGameFinished) {
        const sortedPlayers = currentRoom?.players
            ? [...currentRoom.players].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
            : [];
        const myRank = sortedPlayers.findIndex((p) => String(p.id) === String(user?.id)) + 1;
        const myPlayer = sortedPlayers.find((p) => String(p.id) === String(user?.id));
        const medals = ['🥇', '🥈', '🥉'];
        const medalEmoji = myRank > 0 && myRank <= 3 ? medals[myRank - 1] : '🎖️';

        return (
            <div className={`${styles.container} ${styles.finishedScreen}`}>
                {renderLanguageBar()}
                <div className={styles.finishedCard}>
                    <div className={styles.finishedMedal}>{medalEmoji}</div>
                    <h1 className={styles.finishedTitle}>{t('party.podiumTitle')}</h1>
                    <p className={styles.finishedSubtitle}>{t('party.watchTvForPodium')}</p>

                    <div className={styles.finalStatsBox}>
                        <div className={styles.finalStatItem}>
                            <span className={styles.finalStatLabel}>{t('party.finalRank')}</span>
                            <span className={styles.finalStatValue}>#{myRank > 0 ? myRank : '-'}</span>
                        </div>
                        <div className={styles.finalStatDivider} />
                        <div className={styles.finalStatItem}>
                            <span className={styles.finalStatLabel}>{t('gameplay.points')}</span>
                            <span className={styles.finalStatValue}>{myPlayer?.totalScore ?? 0}</span>
                        </div>
                    </div>

                    <div className={styles.finishedWaiting}>
                        <div className={styles.waitingText}>{t('party.waitingForRestart')}</div>
                    </div>

                    <button
                        type="button"
                        className={`${styles.submitBtn} ${styles.leaveBtn}`}
                        onClick={handleLeaveParty}
                        style={{ marginTop: '20px' }}
                    >
                        {t('party.leavePartyGame')}
                    </button>
                </div>
            </div>
        );
    }

    // View 3: Round Result
    if (roundResult) {
        const myResult = roundResult.results.find((r) => String(r.playerId) === String(user?.id));
        const isCorrect = myResult ? myResult.score > 0 : false;
        const sorted = [...roundResult.results].sort((a, b) => b.totalScore - a.totalScore);
        const myRank = sorted.findIndex((r) => String(r.playerId) === String(user?.id)) + 1;

        return (
            <div
                className={`${styles.container} ${styles.resultScreen} ${
                    isCorrect ? styles.resultCorrect : styles.resultIncorrect
                }`}
            >
                {renderLanguageBar()}
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

    // View 4: Active Round (The 4-Button Gamepad)
    if (currentRound) {
        return (
            <div className={styles.container}>
                <div className={styles.gamepadContainer}>
                    <div className={styles.gamepadHeader}>
                        <span>{user?.login}</span>
                        <span>
                            {t('gameplay.round')} #{currentRound.roundNumber + 1}
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

    // View 5: Lobby Waiting Screen
    const isCreating = currentRoom?.state === RoomState.CREATING;

    return (
        <div className={styles.container}>
            {renderLanguageBar()}
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
