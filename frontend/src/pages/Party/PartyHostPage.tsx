import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { setCurrentRoom } from '../../store/gameplay/gameplaySlice';
import { socketEmitter, socketHandlers } from '../../services/socket';
import { useSocketConnection } from '../../hooks/common/useSocketConnection';
import { useTranslation } from '../../i18n/LanguageContext';
import { useGetCuratedThemesQuery, useLazyGetThemeTracksQuery } from '../../store/api/deezerApi';
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
    const [selectedThemeId, setSelectedThemeId] = useState<string>('ukrainian-hits');
    const [isLaunching, setIsLaunching] = useState(false);

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

        socketHandlers.on('joinedRoom', handleRoomSync);
        socketHandlers.on('currentRoom', handleRoomSync);
        socketHandlers.on('playerLeft', handleRoomSync);
        socketHandlers.on('playerDisconnected', handleRoomSync);

        return () => {
            socketHandlers.off('joinedRoom');
            socketHandlers.off('currentRoom');
            socketHandlers.off('playerLeft');
            socketHandlers.off('playerDisconnected');
        };
    }, [routeRoomId, currentRoom?.id, dispatch]);

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

        socketHandlers.on('roundStarted', handleRoundStarted);
        socketHandlers.on('playerAnswered', handlePlayerAnswered);
        socketHandlers.on('roundResult', handleRoundResult);
        socketHandlers.on('gameFinished', handleGameFinished);
        socketHandlers.on('gameEnded', handleGameFinished);

        return () => {
            socketHandlers.off('roundStarted');
            socketHandlers.off('playerAnswered');
            socketHandlers.off('roundResult');
            socketHandlers.off('gameFinished');
            socketHandlers.off('gameEnded');
        };
    }, []);

    // Round countdown timer
    useEffect(() => {
        if (!currentRound || roundResult || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [currentRound, roundResult, timeLeft]);

    const handleStartParty = async () => {
        if (!currentRoom) return;
        setIsLaunching(true);

        try {
            const themeToLoad = selectedThemeId || 'ukrainian-hits';
            const res = await triggerGetThemeTracks(themeToLoad).unwrap();

            if (res && res.tracks && res.tracks.length > 0) {
                socketEmitter.emit('launchGame', {
                    roomId: currentRoom.id,
                    selectedTracks: {
                        type: 'theme',
                        id: themeToLoad,
                        tracks: res.tracks,
                    },
                });
            } else {
                // Fallback to normal game setup if theme tracks fail
                navigate(`/game/${currentRoom.id}`);
            }
        } catch (err) {
            console.error('Failed to launch party theme', err);
            navigate(`/game/${currentRoom.id}`);
        } finally {
            setIsLaunching(false);
        }
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
                    <button className={styles.backBtn} onClick={() => navigate('/game')}>
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
                                        <span className={styles.cardName}>{p.login}</span>
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
                                    onClick={() => navigate(`/game/${currentRoom?.id}`)}
                                >
                                    {t('party.customTracks')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View 2: Round Active (Arena) */}
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
                        {currentRound.options.map((opt, idx) => (
                            <div
                                key={idx}
                                className={`${styles.optionBlock} ${OPTION_CLASSES[idx]}`}
                            >
                                <span className={styles.optionShape}>{SHAPES[idx]}</span>
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View 3: Round Results & Leaderboard */}
            {roundResult && !isGameFinished && (
                <div className={styles.leaderboardSection}>
                    <h2 className={styles.lbTitle}>🏆 {t('gameplay.totalScores')}</h2>
                    <div className={styles.correctSongBadge}>
                        ✅ {roundResult.correctAnswer}
                    </div>

                    <div className={styles.lbTable}>
                        {sortedLeaderboard.map((res, i) => {
                            const player = currentRoom?.players?.find((p) => p.id === res.playerId);
                            return (
                                <div key={res.playerId} className={styles.lbRow}>
                                    <span className={styles.lbRank}>#{i + 1}</span>
                                    <div className={styles.lbPlayer}>
                                        <img
                                            src={player?.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                            alt=""
                                            className={styles.lbAvatar}
                                        />
                                        <span>{player?.login || 'Player'}</span>
                                        {res.streak && res.streak > 1 && (
                                            <span className={styles.streakBadge}>🔥 x{res.streak}</span>
                                        )}
                                    </div>
                                    <span className={styles.lbPoints}>
                                        {res.totalScore} {t('gameplay.scores')}
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
                                    <span className={styles.podiumScore}>{res.totalScore} {t('gameplay.scores')}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button className={styles.startPartyBtn} onClick={() => navigate('/game')}>
                        {t('party.backToLobby')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PartyHostPage;
