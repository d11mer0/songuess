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
import { FaVolumeUp } from 'react-icons/fa';
import { calculateStartTime, getServerNow, updateServerClockOffset } from '../../utils/calculateStartTime';
import styles from './PartyHostPage.module.css';

interface RoundPayload {
    roundNumber: number;
    options: string[];
    preview: string;
    startedAt?: number;
    endsAt?: number;
    serverTime?: number;
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
    const roundStartedAtRef = useRef<number | null>(null);
    const isResumingRef = useRef<boolean>(false);
    const roundDurationRef = useRef<number>(25);
    const currentRoomIdRef = useRef<string | undefined>(currentRoom?.id);
    currentRoomIdRef.current = currentRoom?.id;
    const isGameFinishedRef = useRef<boolean>(false);

    const [currentRound, setCurrentRound] = useState<RoundPayload | null>(null);
    const [timeLeft, setTimeLeft] = useState(25);
    const [answeredPlayerIds, setAnsweredPlayerIds] = useState<Set<number>>(new Set());
    const [roundResult, setRoundResult] = useState<RoundResultPayload | null>(null);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAudioBlocked, setIsAudioBlocked] = useState(false);
    const [isAudioError, setIsAudioError] = useState(false);
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

    const isMutedRef = useRef<boolean>(isMuted);
    isMutedRef.current = isMuted;
    roundDurationRef.current = currentRoom?.lobbyOptions?.roundDuration || roundDurationRef.current;
    const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const { data: curatedThemes = [] } = useGetCuratedThemesQuery(language);
    const [triggerGetThemeTracks] = useLazyGetThemeTracksQuery();

    const getThemeTitle = (theme: { id: string; title: string }) => {
        switch (theme.id) {
            case 'hits-2000s': return t('themes.hits2000sTitle');
            case 'legendary-80s': return t('themes.legendary80sTitle');
            case 'ukrainian-hits': return t('themes.ukrainianHitsTitle');
            case 'rock-ballads': return t('themes.rockBalladsTitle');
            case 'soundtracks-ost': return t('themes.soundtracksOstTitle');
            default: return theme.title;
        }
    };

    useSocketConnection();

    // Prevent headphone / hardware media keys from playing audio and handle <audio> errors cleanly
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        blockMediaSessionHardwareKeys(audio);

        const handleAudioError = () => {
            if (!audio.getAttribute('src')) return;
            console.warn('TV audio snippet failed to load:', audio.src);
            setIsAudioBlocked(false);
            setIsAudioError(true);
        };
        const handleAudioPlaying = () => {
            setIsAudioError(false);
        };

        audio.addEventListener('error', handleAudioError);
        audio.addEventListener('playing', handleAudioPlaying);

        return () => {
            audio.removeEventListener('error', handleAudioError);
            audio.removeEventListener('playing', handleAudioPlaying);
        };
    }, []);

    // Sync room on mount or route param change
    useEffect(() => {
        const targetId = routeRoomId || currentRoomIdRef.current;
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
            isGameFinishedRef.current = false;
            setIsAudioError(false);
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
            socketHandlers.off('joinedRoom', handleRoomSync);
            socketHandlers.off('currentRoom', handleRoomSync);
            socketHandlers.off('gameStarted', handleRoomSync);
            socketHandlers.off('playerLeft', handleRoomSync);
            socketHandlers.off('playerDisconnected', handleRoomSync);
            socketHandlers.off('gameRestarted', handleGameRestarted);
            socketHandlers.off('roomDeleted', handleRoomDeleted);
        };
    }, [routeRoomId, dispatch, navigate]);

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

    // Handle Unblocking audio via click or any user gesture with real-time sync
    const unlockAudio = useCallback(() => {
        if (isResumingRef.current) return;
        const audio = audioRef.current;
        if (!audio) return;

        // If a round is active, calculate the EXACT real-time moment (accounting for pause/wait time)
        const currentStartedAt = roundStartedAtRef.current;
        if (currentStartedAt) {
            const seekTo = calculateStartTime(currentStartedAt);
            if (Number.isFinite(seekTo)) {
                try {
                    audio.currentTime = seekTo;
                } catch (e) {
                    console.warn('Could not seek audio on TV unlock', e);
                }
            }
        }

        isResumingRef.current = true;
        audio.muted = isMutedRef.current;
        audio.volume = 0.8;
        audio.play()
            .then(() => {
                if (currentStartedAt) {
                    const correctedSeek = calculateStartTime(currentStartedAt);
                    if (Number.isFinite(correctedSeek) && Math.abs(audio.currentTime - correctedSeek) > 0.3) {
                        try {
                            audio.currentTime = correctedSeek;
                        } catch {}
                    }
                }
                setIsAudioBlocked(false);
                setIsAudioError(false);
                isResumingRef.current = false;
                if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
                    try {
                        navigator.mediaSession.playbackState = 'playing';
                    } catch {}
                }
            })
            .catch((err: DOMException | Error) => {
                isResumingRef.current = false;
                if (err?.name === 'AbortError') return;
                if (err?.name === 'NotAllowedError') {
                    console.warn('Playback still prevented on TV unlock', err);
                    setIsAudioBlocked(true);
                } else {
                    console.warn('TV audio error on unlock', err);
                    setIsAudioBlocked(false);
                    setIsAudioError(true);
                }
            });
    }, []);

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
        let cleanupPendingAudio: (() => void) | null = null;

        const playHostRoundAudio = (previewUrl: string, startedAt: number) => {
            cleanupPendingAudio?.();
            cleanupPendingAudio = null;
            const audio = audioRef.current;
            if (!audio || !previewUrl) return;

            setIsAudioError(false);
            audio.pause();
            audio.src = previewUrl;
            audio.volume = 0.8;
            audio.muted = isMutedRef.current;

            let settled = false;
            const seekAndPlay = () => {
                if (settled) return;
                settled = true;
                cleanupPendingAudio?.();
                cleanupPendingAudio = null;

                const seekTo = calculateStartTime(startedAt);
                if (Number.isFinite(seekTo)) {
                    try {
                        audio.currentTime = seekTo;
                    } catch {}
                }
                audio.play().then(() => {
                    const corrected = calculateStartTime(startedAt);
                    if (Number.isFinite(corrected) && Math.abs(audio.currentTime - corrected) > 0.3) {
                        try { audio.currentTime = corrected; } catch {}
                    }
                    setIsAudioBlocked(false);
                    setIsAudioError(false);
                    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
                        try {
                            navigator.mediaSession.playbackState = 'playing';
                        } catch {}
                    }
                }).catch((err: DOMException | Error) => {
                    if (err?.name === 'AbortError') return;
                    if (err?.name === 'NotAllowedError') {
                        setIsAudioBlocked(true);
                    } else {
                        console.warn('TV audio playback error:', err);
                        setIsAudioBlocked(false);
                        setIsAudioError(true);
                    }
                });
            };

            const onLoadError = () => {
                if (settled) return;
                settled = true;
                cleanupPendingAudio?.();
                cleanupPendingAudio = null;
                console.warn('TV audio source failed to load:', previewUrl);
                setIsAudioBlocked(false);
                setIsAudioError(true);
            };

            if (audio.readyState >= 1) {
                seekAndPlay();
            } else {
                audio.addEventListener('loadedmetadata', seekAndPlay, { once: true });
                audio.addEventListener('canplay', seekAndPlay, { once: true });
                audio.addEventListener('error', onLoadError, { once: true });
                cleanupPendingAudio = () => {
                    audio.removeEventListener('loadedmetadata', seekAndPlay);
                    audio.removeEventListener('canplay', seekAndPlay);
                    audio.removeEventListener('error', onLoadError);
                };
            }
        };

        const handleRoundStarted = (payload: RoundPayload) => {
            updateServerClockOffset(payload.serverTime);
            if (launchTimerRef.current) {
                clearTimeout(launchTimerRef.current);
                launchTimerRef.current = null;
            }
            setIsLaunching(false);
            const startedAt = payload.startedAt || getServerNow();
            const roundSec =
                payload.endsAt && startedAt
                    ? Math.max(1, Math.round((payload.endsAt - startedAt) / 1000))
                    : roundDurationRef.current;
            roundDurationRef.current = roundSec;
            roundStartedAtRef.current = startedAt;
            setCurrentRound(payload);
            setRoundResult(null);
            setAnsweredPlayerIds(new Set());
            setTimeLeft(roundSec);
            setHostSelectedOptionIndex(null);
            setIsHostAnswerSubmitted(false);

            if (payload.preview) {
                playHostRoundAudio(payload.preview, startedAt);
            }
        };

        const handlePlayerAnswered = (data: { playerId: number }) => {
            setAnsweredPlayerIds((prev) => new Set(prev).add(data.playerId));
        };

        const handleRoundResult = (payload: RoundResultPayload) => {
            cleanupPendingAudio?.();
            cleanupPendingAudio = null;
            roundStartedAtRef.current = null;
            setIsAudioBlocked(false);
            setIsAudioError(false);
            setRoundResult(payload);
            if (audioRef.current) {
                audioRef.current.pause();
            }
            clearMediaSessionPlayback(audioRef.current);
        };

        const handleGameFinished = () => {
            if (isGameFinishedRef.current) return;
            isGameFinishedRef.current = true;
            cleanupPendingAudio?.();
            cleanupPendingAudio = null;
            roundStartedAtRef.current = null;
            setIsAudioBlocked(false);
            setIsAudioError(false);
            setIsGameFinished(true);
            if (audioRef.current) {
                audioRef.current.pause();
            }
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
            updateServerClockOffset(payload.serverTime);
            setIsLaunching(false);
            const startedAt = payload.startedAt || getServerNow();
            roundStartedAtRef.current = startedAt;
            setCurrentRound({
                roundNumber: payload.roundNumber,
                options: payload.options,
                preview: payload.preview,
                startedAt: payload.startedAt,
                endsAt: payload.endsAt,
                serverTime: payload.serverTime,
            });
            setRoundResult(null);
            const roundSec =
                payload.endsAt && startedAt
                    ? Math.max(1, Math.round((payload.endsAt - startedAt) / 1000))
                    : roundDurationRef.current;
            roundDurationRef.current = roundSec;
            const elapsed = Math.floor((getServerNow() - startedAt) / 1000);
            setTimeLeft(Math.max(0, roundSec - elapsed));
            if (payload.answer) {
                setIsHostAnswerSubmitted(true);
                const idx = payload.options.indexOf(payload.answer);
                setHostSelectedOptionIndex(idx >= 0 ? idx : null);
            }
            if (payload.preview) {
                playHostRoundAudio(payload.preview, startedAt);
            }
        };

        socketHandlers.on('roundStarted', handleRoundStarted);
        socketHandlers.on('playerAnswered', handlePlayerAnswered);
        socketHandlers.on('roundResult', handleRoundResult);
        socketHandlers.on('gameFinished', handleGameFinished);
        socketHandlers.on('gameEnded', handleGameFinished);
        socketHandlers.on('reconnectToRound', handleReconnectToRound);

        return () => {
            socketHandlers.off('roundStarted', handleRoundStarted);
            socketHandlers.off('playerAnswered', handlePlayerAnswered);
            socketHandlers.off('roundResult', handleRoundResult);
            socketHandlers.off('gameFinished', handleGameFinished);
            socketHandlers.off('gameEnded', handleGameFinished);
            socketHandlers.off('reconnectToRound', handleReconnectToRound);
            cleanupPendingAudio?.();
            if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
            clearMediaSessionPlayback(audioRef.current);
        };
    }, []);

    // Round countdown timer (synchronized with roundStartedAtRef)
    useEffect(() => {
        if (!currentRound || roundResult) return;
        const timer = setInterval(() => {
            if (roundStartedAtRef.current) {
                const elapsed = (getServerNow() - roundStartedAtRef.current) / 1000;
                setTimeLeft(Math.max(0, Math.ceil(roundDurationRef.current - elapsed)));
            } else {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }
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

            const playableTracks = tracks.filter((tr: any) => Boolean(tr?.preview));
            if (playableTracks.length >= 4) {
                setLaunchError(null);
                socketEmitter.emit('launchGame', {
                    roomId: currentRoom.id,
                    selectedTracks: {
                        type: 'THEME',
                        id: themeToLoad,
                        tracks: playableTracks,
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
        const playableCount = selectedTracks?.tracks?.filter((tr) => Boolean(tr?.preview)).length ?? 0;
        if (playableCount < 4) {
            console.warn('Not enough playable tracks returned to start party');
            setLaunchError(t('party.notEnoughTracks'));
            return;
        }

        setIsLaunching(true);
        setLaunchError(null);
        if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
        launchTimerRef.current = setTimeout(() => {
            setIsLaunching(false);
        }, 6000);
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

            {/* Fullscreen TV Mode Autoplay Overlay — on top of everything */}
            {isAudioError && !roundResult && currentRound && (
                <div
                    role="status"
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 90,
                        background: 'rgba(230, 57, 70, 0.92)',
                        color: '#fff',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                    }}
                    onClick={unlockAudio}
                >
                    ⚠️ {t('daily.audioError')}
                </div>
            )}

            {isAudioBlocked && !isAudioError && !roundResult && (
                <div
                    className={styles.tvAutoplayOverlay}
                    onClick={unlockAudio}
                    role="button"
                    tabIndex={0}
                    aria-label={t('gameplay.tapToUnmuteTitle')}
                >
                    <div className={styles.tvAutoplayCard} onClick={unlockAudio}>
                        <span className={styles.tvAutoplayIcon}>🔊</span>
                        <h2 className={styles.tvAutoplayTitle}>{t('gameplay.tapToUnmuteTitle')}</h2>
                        <p className={styles.tvAutoplaySubtitle}>{t('gameplay.tapToUnmuteSubtitle')}</p>
                        <button className={styles.tvAutoplayBtn} onClick={unlockAudio}>
                            <FaVolumeUp /> <span>{t('party.unmuteHint')}</span>
                        </button>
                    </div>
                    <p className={styles.tvAutoplayHint}>{t('gameplay.tapToUnmuteHint')}</p>
                </div>
            )}

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
                    <span className={styles.partyBadge}>{t('party.partyBadge')}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                                                    <span className={styles.themeChipTitle}>{getThemeTitle(theme)}</span>
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
