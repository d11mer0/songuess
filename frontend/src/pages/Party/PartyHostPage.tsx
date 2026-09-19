import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { setCurrentRoom } from '../../store/gameplay/gameplaySlice';
import { socketEmitter, socketHandlers } from '../../services/socket';
import { useSocketConnection } from '../../hooks/common/useSocketConnection';
import { useTranslation } from '../../i18n/LanguageContext';
import { useGetCuratedThemesQuery, useLazyGetThemeTracksQuery } from '../../store/api/deezerApi';
import { RoomState } from '../../types/roomTypes';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import styles from './PartyHostPage.module.css';

interface RoundPayload {
    roundNumber: number;
    options: string[];
    preview: string;
}

interface RoundResultItem {
    playerId: number;
    answer: string;
    score: number;
    streak?: number;
    totalScore: number;
}

interface RoundResultPayload {
    correctAnswer: string;
    results: RoundResultItem[];
}

const SHAPES = ['▲', '◆', '●', '■'];
const OPTION_CLASSES = [styles.optionRed, styles.optionBlue, styles.optionYellow, styles.optionGreen];

const PartyHostPage: React.FC = () => {
    const { id: routeRoomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.user);
    const currentRoom = useAppSelector(selectCurrentRoom);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [currentRound, setCurrentRound] = useState<RoundPayload | null>(null);
    const [timeLeft, setTimeLeft] = useState(25);
    const [answeredPlayerIds, setAnsweredPlayerIds] = useState<Set<number>>(new Set());
    const [roundResult, setRoundResult] = useState<RoundResultPayload | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAudioBlocked, setIsAudioBlocked] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState<string>('ukrainian-hits');
    const [isLaunching, setIsLaunching] = useState(false);

    const toggleMute = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted;
            setIsMuted(audioRef.current.muted);
        }
    }, []);

    // Host gameplay state
    const [hostSelectedOptionIndex, setHostSelectedOptionIndex] = useState<number | null>(null);
    const [isHostAnswerSubmitted, setIsHostAnswerSubmitted] = useState(false);

    const { data: curatedThemes = [] } = useGetCuratedThemesQuery();
    const [triggerGetThemeTracks] = useLazyGetThemeTracksQuery();

    useSocketConnection();

    // Sync room on mount or route param change
    useEffect(() => {
        const targetId = routeRoomId || currentRoom?.id;
        if (targetId) {
            socketEmitter.emit('joinRoom', { id: targetId });
            socketEmitter.emit('getCurrentRoom');
        }

        const handleRoomSync = (room: any) => {
            if (room) {
                dispatch(setCurrentRoom(room));
            }
        };

        const handleGameRestarted = (room: any) => {
            if (room) {
                dispatch(setCurrentRoom(room));
            }
            setIsGameFinished(false);
            setCurrentRound(null);
            setRoundResult(null);
            setHostSelectedOptionIndex(null);
            setIsHostAnswerSubmitted(false);
        };

        socketHandlers.on('joinedRoom', handleRoomSync);
        socketHandlers.on('currentRoom', handleRoomSync);
        socketHandlers.on('gameStarted', handleRoomSync);
        socketHandlers.on('playerLeft', handleRoomSync);
        socketHandlers.on('playerDisconnected', handleRoomSync);
        socketHandlers.on('gameRestarted', handleGameRestarted);

        return () => {
            socketHandlers.off('joinedRoom');
            socketHandlers.off('currentRoom');
            socketHandlers.off('gameStarted');
            socketHandlers.off('playerLeft');
            socketHandlers.off('playerDisconnected');
            socketHandlers.off('gameRestarted');
        };
    }, [routeRoomId, currentRoom?.id, dispatch]);

    // Only the leader can host the TV page; redirect non-host players back to the game room
    useEffect(() => {
        if (currentRoom && user && currentRoom.leaderId && currentRoom.leaderId !== user.id) {
            navigate(`/game/${currentRoom.id}`);
        }
    }, [currentRoom?.id, currentRoom?.leaderId, user?.id, navigate]);

    const displayCode = (currentRoom?.shortCode || currentRoom?.id || routeRoomId || '').toUpperCase();
    const joinUrl = `${window.location.origin}/play/${displayCode}`;

    // Render QR Code for big TV screen
    useEffect(() => {
        if (canvasRef.current && displayCode) {
            QRCode.toCanvas(canvasRef.current, joinUrl, {
                width: 220,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            }).catch((err) => console.error('Error drawing TV QR', err));
        }
    }, [joinUrl, displayCode]);

    // Handle Unblocking audio via click
    const unlockAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                setIsAudioBlocked(false);
            }).catch(() => {});
        }
    }, []);

    // Listen to gameplay events
    useEffect(() => {
        const handleRoundStarted = (payload: RoundPayload) => {
            setCurrentRound(payload);
            setRoundResult(null);
            setAnsweredPlayerIds(new Set());
            setTimeLeft(25);
            setHostSelectedOptionIndex(null);
            setIsHostAnswerSubmitted(false);

            if (audioRef.current && payload.preview) {
                audioRef.current.src = payload.preview;
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {
                    setIsAudioBlocked(true);
                });
            }
        };

        const handlePlayerAnswered = (data: { playerId: number }) => {
            setAnsweredPlayerIds((prev) => new Set(prev).add(data.playerId));
        };

        const handleRoundResult = (payload: RoundResultPayload) => {
            setRoundResult(payload);
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };

        const handleGameFinished = () => {
            setIsGameFinished(true);
            try {
                confetti({
                    particleCount: 250,
                    spread: 120,
                    origin: { y: 0.5 },
                });
            } catch {}
        };

        const handleReconnectToRound = (payload: any) => {
            if (!payload) return;
            setCurrentRound({
                roundNumber: payload.roundNumber,
                options: payload.options,
                preview: payload.preview,
            });
            setRoundResult(null);
            const elapsed = payload.startedAt ? Math.floor((Date.now() - payload.startedAt) / 1000) : 0;
            setTimeLeft(Math.max(0, 25 - elapsed));
            if (payload.answer) {
                setIsHostAnswerSubmitted(true);
                const idx = payload.options.indexOf(payload.answer);
                setHostSelectedOptionIndex(idx >= 0 ? idx : null);
            }
            if (audioRef.current && payload.preview) {
                audioRef.current.src = payload.preview;
                if (payload.startedAt) {
                    audioRef.current.currentTime = Math.min(25, elapsed);
                }
                audioRef.current.play().catch(() => setIsAudioBlocked(true));
            }
        };

        socketHandlers.on('roundStarted', handleRoundStarted);
        socketHandlers.on('playerAnswered', handlePlayerAnswered);
        socketHandlers.on('roundResult', handleRoundResult);
        socketHandlers.on('gameFinished', handleGameFinished);
        socketHandlers.on('gameEnded', handleGameFinished);
        socketHandlers.on('reconnectToRound', handleReconnectToRound);

        return () => {
            socketHandlers.off('roundStarted');
            socketHandlers.off('playerAnswered');
            socketHandlers.off('roundResult');
            socketHandlers.off('gameFinished');
            socketHandlers.off('gameEnded');
            socketHandlers.off('reconnectToRound');
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    // Round countdown timer
    useEffect(() => {
        if (!currentRound || roundResult) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [currentRound, roundResult]);

    // Host can answer by clicking an option
    const handleHostAnswer = useCallback(
        (index: number) => {
            if (isHostAnswerSubmitted || !currentRound || !currentRoom) return;

            setHostSelectedOptionIndex(index);
            setIsHostAnswerSubmitted(true);

            const answer = currentRound.options[index];
            socketEmitter.emit('submitAnswer', {
                roomId: currentRoom.id,
                roundNumber: currentRound.roundNumber,
                answer,
                snippetDurationUsed: 0,
            });
        },
        [isHostAnswerSubmitted, currentRound, currentRoom],
    );

    // Host keyboard shortcuts: Keys 1, 2, 3, 4
    useEffect(() => {
        if (!currentRound || roundResult || isHostAnswerSubmitted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['1', '2', '3', '4'].includes(e.key)) {
                const idx = parseInt(e.key, 10) - 1;
                if (idx >= 0 && idx < currentRound.options.length) {
                    handleHostAnswer(idx);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentRound, roundResult, isHostAnswerSubmitted, handleHostAnswer]);

    const handleStartParty = async () => {
        if (!currentRoom) return;
        setIsLaunching(true);

        try {
            const themeToLoad = selectedThemeId || 'ukrainian-hits';
            const res = await triggerGetThemeTracks(themeToLoad).unwrap();

            // Extract the track array properly (Deezer returns { tracks: { data: [...] } } or { tracks: [...] })
            let tracks: any[] = [];
            if (Array.isArray(res?.tracks)) {
                tracks = res.tracks;
            } else if (Array.isArray(res?.tracks?.data)) {
                tracks = res.tracks.data;
            } else if (Array.isArray(res)) {
                tracks = res;
            }

            console.log('🚀 Launching party game with tracks count:', tracks.length);

            if (tracks.length >= 3) {
                socketEmitter.emit('launchGame', {
                    roomId: currentRoom.id,
                    selectedTracks: {
                        type: 'THEME',
                        id: themeToLoad,
                        tracks: tracks,
                    },
                });
            } else {
                console.warn('Not enough tracks returned, navigating to setup');
                if (currentRoom.state === RoomState.ADDING) {
                    socketEmitter.emit('startGame', { id: currentRoom.id });
                }
                navigate(`/game/${currentRoom.id}`);
            }
        } catch (err) {
            console.error('Failed to launch party theme', err);
            if (currentRoom.state === RoomState.ADDING) {
                socketEmitter.emit('startGame', { id: currentRoom.id });
            }
            navigate(`/game/${currentRoom.id}`);
        } finally {
            setIsLaunching(false);
        }
    };

    const handleBackToLobby = () => {
        if (currentRoom) {
            socketEmitter.emit('switchPartyMode', {
                roomId: currentRoom.id,
                isPartyMode: false,
            });
            navigate(`/game/${currentRoom.id}`);
        } else {
            navigate('/game');
        }
    };

    const handleCustomTracks = () => {
        if (!currentRoom) return;
        socketEmitter.emit('switchPartyMode', {
            roomId: currentRoom.id,
            isPartyMode: false,
        });
        if (currentRoom.state === RoomState.ADDING) {
            socketEmitter.emit('startGame', { id: currentRoom.id });
        }
        navigate(`/game/${currentRoom.id}`);
    };

    const handleRestart = () => {
        if (!currentRoom) return;
        socketEmitter.emit('restartGame', { roomId: currentRoom.id });
        setIsGameFinished(false);
        setCurrentRound(null);
        setRoundResult(null);
        setHostSelectedOptionIndex(null);
        setIsHostAnswerSubmitted(false);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    const sortedLeaderboard = roundResult
        ? [...roundResult.results].sort((a, b) => b.totalScore - a.totalScore)
        : [];

    return (
        <div className={styles.container} onClick={isAudioBlocked ? unlockAudio : undefined}>
            <audio ref={audioRef} />

            {/* Top Bar on TV */}
            <div className={styles.header}>
                <div className={styles.brand}>
                    <button className={styles.backBtn} onClick={handleBackToLobby}>
                        {t('party.backToLobby')}
                    </button>
                    <span className={styles.logoText}>SonGuess</span>
                    <span className={styles.partyBadge}>TV PARTY MODE 📺</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {isAudioBlocked && (
                        <button className={styles.unmuteBtn} onClick={unlockAudio}>
                            {t('party.unmuteHint')}
                        </button>
                    )}

                    <button
                        className={styles.fullscreenBtn}
                        onClick={toggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>

                    <button className={styles.fullscreenBtn} onClick={toggleFullscreen}>
                        {isFullscreen ? t('party.exitFullscreen') : t('party.fullscreen')}
                    </button>

                    <div className={styles.codeBanner}>
                        <span className={styles.codeLabel}>{t('party.roomCode')}:</span>
                        <span className={styles.codeValue}>{displayCode}</span>
                    </div>
                </div>
            </div>

            {/* View 1: TV Lobby */}
            {!currentRound && !roundResult && !isGameFinished && (
                <div className={styles.lobbyContent}>
                    <div className={styles.qrCard}>
                        <div className={styles.qrWrapper}>
                            <canvas ref={canvasRef} className={styles.qrCanvas} />
                        </div>
                        <div className={styles.qrInstruction}>{t('party.scanToPlay')}</div>
                        <div className={styles.qrLink}>{joinUrl}</div>
                    </div>

                    <div className={styles.playersSection}>
                        <div>
                            <div className={styles.playersHeader}>
                                <span className={styles.playersCount}>
                                    👥 {t('party.playersConnected')}: {currentRoom?.players?.length || 0}
                                </span>
                            </div>

                            <div className={styles.playersGrid}>
                                {currentRoom?.players?.map((p) => (
                                    <div key={p.id} className={styles.playerCard}>
                                        <img
                                            src={p.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                            alt={p.login}
                                            className={styles.cardAvatar}
                                        />
                                        <span className={styles.cardName}>
                                            {p.login}
                                            {p.id === user?.id && ` (${t('party.hostBadge')})`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Theme Selection & Start Controls */}
                        <div className={styles.controlsBlock}>
                            <div className={styles.themePicker}>
                                <span className={styles.themeLabel}>{t('party.selectTheme')}</span>
                                <div className={styles.themeChips}>
                                    {curatedThemes.map((theme) => (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            className={`${styles.themeChip} ${selectedThemeId === theme.id ? styles.themeChipActive : ''}`}
                                            onClick={() => setSelectedThemeId(theme.id)}
                                        >
                                            {theme.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.actionButtons}>
                                <button
                                    className={styles.startPartyBtn}
                                    onClick={handleStartParty}
                                    disabled={isLaunching}
                                >
                                    {isLaunching ? t('party.launchingGame') : `${t('party.startPartyGame')} 🚀`}
                                </button>
                                <button
                                    className={styles.customTracksBtn}
                                    onClick={handleCustomTracks}
                                >
                                    {t('party.customTracks')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View 2: Round Active (Arena with Host interactive answer options) */}
            {currentRound && !roundResult && !isGameFinished && (
                <div className={styles.arena}>
                    <div className={styles.roundTopBar}>
                        <div className={styles.timerBox}>⏱️ {timeLeft}s</div>
                        <div className={styles.answersCounter}>
                            ⚡ {answeredPlayerIds.size} / {currentRoom?.players?.length || 0} {t('party.answersCount')}
                        </div>
                    </div>

                    <div className={styles.visualizerArea}>
                        <div className={styles.vinylDisc} />
                    </div>

                    <div className={styles.optionsGrid}>
                        {currentRound.options.map((opt, idx) => {
                            const isSelected = hostSelectedOptionIndex === idx;
                            const isDimmed = isHostAnswerSubmitted && !isSelected;

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`${styles.optionBlock} ${OPTION_CLASSES[idx]} ${
                                        isSelected ? styles.optionSelectedByHost : ''
                                    } ${isDimmed ? styles.optionDimmedForHost : ''}`}
                                    onClick={() => handleHostAnswer(idx)}
                                    disabled={isHostAnswerSubmitted}
                                >
                                    <div className={styles.optionLeft}>
                                        <span className={styles.optionShape}>{SHAPES[idx]}</span>
                                        <span className={styles.optionText}>{opt}</span>
                                    </div>
                                    <div className={styles.optionRight}>
                                        <span className={styles.keyHint}>[{idx + 1}]</span>
                                        {isSelected && (
                                            <span className={styles.hostBadge}>
                                                ✓ {t('party.hostAnswered')}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {isHostAnswerSubmitted && (
                        <div className={styles.hostStatusBanner}>
                            {t('party.yourAnswerRecorded')}
                        </div>
                    )}
                </div>
            )}

            {/* View 3: Round Results & Leaderboard */}
            {roundResult && !isGameFinished && (
                <div className={styles.leaderboardSection}>
                    <h2 className={styles.lbTitle}>🏆 {t('gameplay.totalScoresTitle')}</h2>
                    <div className={styles.correctSongBadge}>
                        ✅ {roundResult.correctAnswer}
                    </div>

                    <div className={styles.lbTable}>
                        {sortedLeaderboard.map((res, i) => {
                            const player = currentRoom?.players?.find((p) => p.id === res.playerId);
                            const isMe = player?.id === user?.id;

                            return (
                                <div
                                    key={res.playerId}
                                    className={`${styles.lbRow} ${isMe ? styles.lbRowCurrent : ''}`}
                                >
                                    <span className={styles.lbRank}>#{i + 1}</span>
                                    <div className={styles.lbPlayer}>
                                        <img
                                            src={player?.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                            alt=""
                                            className={styles.lbAvatar}
                                        />
                                        <span className={styles.lbPlayerName}>
                                            {player?.login || 'Player'}
                                            {isMe && <span className={styles.meTag}> ({t('party.hostBadge')})</span>}
                                        </span>
                                        {Boolean(res.streak && res.streak > 1) && (
                                            <span className={styles.streakBadge}>🔥 x{res.streak}</span>
                                        )}
                                    </div>
                                    <span className={styles.lbPoints}>
                                        {res.totalScore} {t('gameplay.points')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* View 4: Final Podium Screen */}
            {isGameFinished && (
                <div className={styles.podiumSection}>
                    <h1 className={styles.podiumTitle}>{t('party.podiumTitle')}</h1>
                    <div className={styles.podiumGrid}>
                        {sortedLeaderboard.slice(0, 3).map((res, i) => {
                            const player = currentRoom?.players?.find((p) => p.id === res.playerId);
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <div key={res.playerId} className={`${styles.podiumCard} ${styles[`podiumRank${i + 1}`]}`}>
                                    <div className={styles.podiumMedal}>{medals[i]}</div>
                                    <img
                                        src={player?.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                        alt=""
                                        className={styles.podiumAvatar}
                                    />
                                    <span className={styles.podiumName}>{player?.login || 'Player'}</span>
                                    <span className={styles.podiumScore}>{res.totalScore} {t('gameplay.points')}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button className={styles.startPartyBtn} onClick={handleRestart}>
                            🔄 {t('gameplay.restartGame') || 'Зіграти ще раз'}
                        </button>
                        <button className={styles.customTracksBtn} onClick={handleBackToLobby}>
                            {t('party.backToLobby')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartyHostPage;
