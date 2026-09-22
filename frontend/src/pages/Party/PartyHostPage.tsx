import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { setCurrentRoom } from '../../store/gameplay/gameplaySlice';
import { socketEmitter, socketHandlers } from '../../services/socket';
import { useSocketConnection } from '../../hooks/common/useSocketConnection';
import { useTranslation } from '../../i18n/LanguageContext';
import { useGetCuratedThemesQuery, useLazyGetThemeTracksQuery } from '../../store/api/deezerApi';
import { RoomState } from '../../types/roomTypes';
import TrackSelectionBlock from '../../components/Game/Creating/CreatingGame/TrackSelectionBlock';
import { GameType, SelectedTracks } from '../../types/gameTypes';
import { mapBackendRoomToFrontend } from '../../utils/mapBackendRoomToFrontend';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
    blockMediaSessionHardwareKeys,
    clearMediaSessionPlayback,
} from '../../utils/audio/blockMediaSessionHardwareKeys';
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
    const { t, language } = useTranslation();
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
    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('songuess_tv_muted') === 'true';
        }
        return false;
    });
    const [selectedThemeId, setSelectedThemeId] = useState<string>('ukrainian-hits');
    const [selectedGameType, setSelectedGameType] = useState<GameType>('THEME');
    const [isLaunching, setIsLaunching] = useState(false);
    const [launchError, setLaunchError] = useState<string | null>(null);

    const toggleMute = useCallback(() => {
        if (audioRef.current) {
            const next = !audioRef.current.muted;
            audioRef.current.muted = next;
            setIsMuted(next);
            if (typeof window !== 'undefined') {
                localStorage.setItem('songuess_tv_muted', String(next));
            }
        }
    }, []);

    // Host gameplay state
    const [hostSelectedOptionIndex, setHostSelectedOptionIndex] = useState<number | null>(null);
    const [isHostAnswerSubmitted, setIsHostAnswerSubmitted] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

    const { data: curatedThemes = [] } = useGetCuratedThemesQuery();
    const [triggerGetThemeTracks] = useLazyGetThemeTracksQuery();

    useSocketConnection();

    // Prevent headphone / hardware media keys from playing audio
    useEffect(() => {
        blockMediaSessionHardwareKeys(audioRef.current);
    }, []);

    // Sync room on mount or route param change
    useEffect(() => {
        const targetId = routeRoomId || currentRoom?.id;
        if (targetId) {
            socketEmitter.emit('joinRoom', { id: targetId });
            socketEmitter.emit('getCurrentRoom');
        }

        const handleRoomSync = (room: any) => {
            if (room) {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
            }
        };

        const handleGameRestarted = (room: any) => {
            if (room) {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
            }
            setIsGameFinished(false);
            setCurrentRound(null);
            setRoundResult(null);
            setHostSelectedOptionIndex(null);
            setIsHostAnswerSubmitted(false);
        };

        const handleRoomDeleted = () => {
            dispatch(setCurrentRoom(null));
            navigate('/game');
        };

        socketHandlers.on('joinedRoom', handleRoomSync);
        socketHandlers.on('currentRoom', handleRoomSync);
        socketHandlers.on('gameStarted', handleRoomSync);
        socketHandlers.on('playerLeft', handleRoomSync);
        socketHandlers.on('playerDisconnected', handleRoomSync);
        socketHandlers.on('gameRestarted', handleGameRestarted);
        socketHandlers.on('roomDeleted', handleRoomDeleted);

        return () => {
            socketHandlers.off('joinedRoom');
            socketHandlers.off('currentRoom');
            socketHandlers.off('gameStarted');
            socketHandlers.off('playerLeft');
            socketHandlers.off('playerDisconnected');
            socketHandlers.off('gameRestarted');
            socketHandlers.off('roomDeleted');
        };
    }, [routeRoomId, currentRoom?.id, dispatch, navigate]);

    // Only the leader can host the TV page; redirect non-host players to the party controller
    useEffect(() => {
        if (currentRoom && user?.id && currentRoom.leaderId && String(currentRoom.leaderId) !== String(user.id)) {
            const code = currentRoom.shortCode || currentRoom.id;
            navigate(`/play/${code}`);
        }
    }, [currentRoom?.id, currentRoom?.leaderId, currentRoom?.shortCode, user?.id, navigate]);

    const displayCode = (currentRoom?.shortCode || currentRoom?.id || routeRoomId || '').toUpperCase();
    const joinUrl = `${window.location.origin}/play/${displayCode}?lang=${language}`;

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

    // Handle Unblocking audio via click or any user gesture
    const unlockAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
            audioRef.current.volume = 0.8;
            audioRef.current.play().then(() => {
                setIsAudioBlocked(false);
            }).catch(() => {});
        }
    }, [isMuted]);

    useEffect(() => {
        if (!isAudioBlocked) return;
        const handleInteraction = () => {
            unlockAudio();
        };
        window.addEventListener('pointerdown', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });
        return () => {
            window.removeEventListener('pointerdown', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, [isAudioBlocked, unlockAudio]);

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
                audioRef.current.volume = 0.8;
                audioRef.current.muted = isMuted;
                audioRef.current.play().then(() => {
                    setIsAudioBlocked(false);
                    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
                        try {
                            navigator.mediaSession.playbackState = 'playing';
                        } catch {}
                    }
                }).catch(() => {
                    setIsAudioBlocked(true);
                });
            }
        };

        const handlePlayerAnswered = (data: { playerId: number }) => {
            setAnsweredPlayerIds((prev) => new Set(prev).add(data.playerId));
        };

        const handleRoundResult = (payload: RoundResultPayload) => {
            setRoundResult(payload);
            clearMediaSessionPlayback(audioRef.current);
        };

        const handleGameFinished = () => {
            setIsGameFinished(true);
            clearMediaSessionPlayback(audioRef.current);
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
                audioRef.current.volume = 0.8;
                audioRef.current.muted = isMuted;
                if (payload.startedAt) {
                    audioRef.current.currentTime = Math.min(25, elapsed);
                }
                audioRef.current.play().then(() => {
                    setIsAudioBlocked(false);
                    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
                        try {
                            navigator.mediaSession.playbackState = 'playing';
                        } catch {}
                    }
                }).catch(() => setIsAudioBlocked(true));
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
            clearMediaSessionPlayback(audioRef.current);
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
        setLaunchError(null);

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
                setLaunchError(null);
                socketEmitter.emit('launchGame', {
                    roomId: currentRoom.id,
                    selectedTracks: {
                        type: 'THEME',
                        id: themeToLoad,
                        tracks: tracks,
                    },
                });
            } else {
                console.warn('Not enough tracks returned for theme');
                setLaunchError(t('party.notEnoughTracks'));
            }
        } catch (err) {
            console.error('Failed to launch party theme', err);
            setLaunchError(t('party.themeLoadError'));
        } finally {
            setIsLaunching(false);
        }
    };

    const handleStartWithSelectedTracks = (selectedTracks: SelectedTracks) => {
        if (!currentRoom) return;
        if (!selectedTracks?.tracks || selectedTracks.tracks.length < 3) {
            console.warn('Not enough tracks returned to start party');
            setLaunchError(t('party.notEnoughTracks'));
            return;
        }

        setIsLaunching(true);
        setLaunchError(null);
        socketEmitter.emit('launchGame', {
            roomId: currentRoom.id,
            selectedTracks,
        });
    };

    const handleBackToLobby = () => {
        if (currentRoom) {
            socketEmitter.emit('switchPartyMode', {
                roomId: currentRoom.id,
                isPartyMode: false,
            });
            if (currentRoom.state === RoomState.CREATING || currentRoom.state === RoomState.STARTED) {
                navigate(`/game/${currentRoom.id}`);
            } else {
                navigate('/game');
            }
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

    // Ensure finished state is preserved if refreshed when game is ended
    useEffect(() => {
        if (currentRoom?.state === RoomState.ENDED) {
            setIsGameFinished(true);
        }
    }, [currentRoom?.state]);

    const sortedLeaderboard = useMemo(() => {
        if (roundResult?.results && roundResult.results.length > 0) {
            return [...roundResult.results].sort((a, b) => b.totalScore - a.totalScore);
        }
        if (currentRoom?.players && currentRoom.players.length > 0) {
            return [...currentRoom.players]
                .map((p) => ({
                    playerId: p.id,
                    answer: '',
                    score: 0,
                    streak: p.streak ?? 0,
                    totalScore: p.totalScore ?? 0,
                }))
                .sort((a, b) => b.totalScore - a.totalScore);
        }
        return [];
    }, [roundResult, currentRoom?.players]);

    return (
        <div className={styles.container} onClick={isAudioBlocked ? unlockAudio : undefined}>
            <audio ref={audioRef} />

            {/* Top Bar on TV */}
            <div className={styles.header}>
                <div className={styles.brand}>
                    <button className={styles.finishGameBtn} onClick={() => setIsFinishModalOpen(true)}>
                        🚪 {t('party.finishGame')}
                    </button>
                    <div className={styles.brandLogo}>
                        <img src="/logo.png" alt="SonGuess" className={styles.tvLogoImg} />
                        <span className={styles.logoText}>SonGuess</span>
                    </div>
                    <span className={styles.partyBadge}>TV PARTY MODE 📺</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {isAudioBlocked && (
                        <button className={styles.unmuteBtn} onClick={unlockAudio}>
                            {t('party.unmuteHint')}
                        </button>
                    )}

                    <LanguageSwitcher />

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
                    {/* Left Column: QR Code & Connected Players (Attendance Center) */}
                    <div className={styles.sidebarArea}>
                        <div className={styles.qrCard}>
                            <div className={styles.qrWrapper}>
                                <canvas ref={canvasRef} className={styles.qrCanvas} />
                            </div>
                            <div className={styles.qrInstruction}>{t('party.scanToPlay')}</div>
                            <div className={styles.qrLink}>{joinUrl}</div>
                        </div>

                        <div className={styles.playersSidebarCard}>
                            <div className={styles.playersHeader}>
                                <span className={styles.playersCount}>
                                    👥 {t('party.playersConnected')} ({currentRoom?.players?.length || 0})
                                </span>
                            </div>

                            <div className={styles.playersList}>
                                {currentRoom?.players && currentRoom.players.length > 0 ? (
                                    currentRoom.players.map((p) => (
                                        <div key={p.id} className={styles.playerCard}>
                                            <img
                                                src={p.avatar || 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg'}
                                                alt={p.login}
                                                className={styles.cardAvatar}
                                            />
                                            <div className={styles.cardInfo}>
                                                <span className={styles.cardName}>{p.login}</span>
                                                {p.id === user?.id && (
                                                    <span className={styles.hostBadgeTag}>{t('party.hostBadge')}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.noPlayersNotice}>
                                        {t('party.waitingForFriends')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Game Setup & Launch Center (Main Stage) */}
                    <div className={styles.mainControlsArea}>
                        <div className={styles.setupCard}>
                            <div className={styles.setupHeader}>
                                <h2 className={styles.setupTitle}>🎮 {t('gameCreation.selectGameType')}</h2>
                                <p className={styles.setupSubtitle}>{t('party.chooseMusicMode')}</p>
                            </div>

                            <div className={styles.modeTabs}>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${selectedGameType === 'THEME' ? styles.modeTabActive : ''}`}
                                    onClick={() => {
                                        setSelectedGameType('THEME');
                                        setLaunchError(null);
                                    }}
                                >
                                    {t('gameCreation.typeThemes')}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${selectedGameType === 'ARTIST' ? styles.modeTabActive : ''}`}
                                    onClick={() => {
                                        setSelectedGameType('ARTIST');
                                        setLaunchError(null);
                                    }}
                                >
                                    {t('gameCreation.typeArtist')}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${selectedGameType === 'PLAYLIST' ? styles.modeTabActive : ''}`}
                                    onClick={() => {
                                        setSelectedGameType('PLAYLIST');
                                        setLaunchError(null);
                                    }}
                                >
                                    {t('gameCreation.typePlaylist')}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${selectedGameType === 'ALBUM' ? styles.modeTabActive : ''}`}
                                    onClick={() => {
                                        setSelectedGameType('ALBUM');
                                        setLaunchError(null);
                                    }}
                                >
                                    {t('gameCreation.typeAlbum')}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${selectedGameType === 'URL' ? styles.modeTabActive : ''}`}
                                    onClick={() => {
                                        setSelectedGameType('URL');
                                        setLaunchError(null);
                                    }}
                                >
                                    {t('gameCreation.typeUrl')}
                                </button>
                            </div>

                            {launchError && (
                                <div className={styles.launchErrorBanner}>
                                    <span>⚠️ {launchError}</span>
                                    <button
                                        type="button"
                                        className={styles.clearErrorBtn}
                                        onClick={() => setLaunchError(null)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {selectedGameType === 'THEME' ? (
                                <div className={styles.themeModeContainer}>
                                    <div className={styles.themePicker}>
                                        <span className={styles.themeLabel}>{t('party.curatedThemesTitle')}</span>
                                        <div className={styles.themeChips}>
                                            {curatedThemes.map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    className={`${styles.themeChip} ${selectedThemeId === theme.id ? styles.themeChipActive : ''}`}
                                                    onClick={() => setSelectedThemeId(theme.id)}
                                                >
                                                    <span className={styles.themeChipTitle}>{theme.title}</span>
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
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.customSelectionWrapper}>
                                    <TrackSelectionBlock
                                        key={selectedGameType}
                                        selectedGameType={selectedGameType}
                                        onStart={handleStartWithSelectedTracks}
                                        autoFocus={true}
                                    />
                                </div>
                            )}
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
                        <button className={styles.finishGameBtn} onClick={() => setIsFinishModalOpen(true)}>
                            🚪 {t('party.finishGame')}
                        </button>
                    </div>
                </div>
            )}

            {/* Finish Game Confirmation Modal */}
            {isFinishModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsFinishModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalIcon}>⚠️</div>
                        <h2 className={styles.modalTitle}>{t('party.finishGameConfirmTitle')}</h2>
                        <p className={styles.modalText}>{t('party.finishGameConfirmText')}</p>
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.modalCancelBtn}
                                onClick={() => setIsFinishModalOpen(false)}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                className={styles.modalConfirmBtn}
                                onClick={() => {
                                    setIsFinishModalOpen(false);
                                    handleBackToLobby();
                                }}
                            >
                                {t('party.finishGame')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartyHostPage;
