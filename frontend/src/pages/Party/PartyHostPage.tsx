import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { setCurrentRoom } from '../../store/gameplay/gameplaySlice';
import { socketEmitter, socketHandlers } from '../../services/socket';
import { useSocketConnection } from '../../hooks/common/useSocketConnection';
import { useTranslation } from '../../i18n/LanguageContext';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import styles from './PartyHostPage.module.css';

interface RoundPayload {
    roundNumber: number;
    options: string[];
    preview: string;
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

    useSocketConnection();

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

    // Listen to gameplay events
    useEffect(() => {
        const handleRoundStarted = (payload: RoundPayload) => {
            setCurrentRound(payload);
            setRoundResult(null);
            setAnsweredPlayerIds(new Set());
            setTimeLeft(25);

            if (audioRef.current && payload.preview) {
                audioRef.current.src = payload.preview;
                audioRef.current.play().catch(() => {});
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
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.5 },
                });
            } catch {}
        };

        socketHandlers.on('roundStarted', handleRoundStarted);
        socketHandlers.on('playerAnswered', handlePlayerAnswered);
        socketHandlers.on('roundResult', handleRoundResult);
        socketHandlers.on('gameFinished', handleGameFinished);

        return () => {
            socketHandlers.off('roundStarted');
            socketHandlers.off('playerAnswered');
            socketHandlers.off('roundResult');
            socketHandlers.off('gameFinished');
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

    const handleStartGame = () => {
        if (!currentRoom) return;
        navigate(`/game/${currentRoom.id}`);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    return (
        <div className={styles.container}>
            <audio ref={audioRef} />

            {/* Top Bar on TV */}
            <div className={styles.header}>
                <div className={styles.brand}>
                    <span className={styles.logoText}>SonGuess</span>
                    <span className={styles.partyBadge}>TV PARTY MODE 📺</span>
                </div>

                <div className={styles.codeBanner}>
                    <span className={styles.codeLabel}>{t('party.roomCode')}:</span>
                    <span className={styles.codeValue}>{displayCode}</span>
                </div>
            </div>

            {/* View 1: TV Lobby */}
            {!currentRound && !roundResult && (
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

                        <button className={styles.startPartyBtn} onClick={handleStartGame}>
                            {t('party.startPartyGame')} 🚀
                        </button>
                    </div>
                </div>
            )}

            {/* View 2: Round Active (Arena) */}
            {currentRound && !roundResult && (
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
            {roundResult && (
                <div className={styles.leaderboardSection}>
                    <h2 className={styles.lbTitle}>🏆 {t('gameplay.totalScores')}</h2>
                    <div className={styles.lbTable}>
                        {[...roundResult.results]
                            .sort((a, b) => b.totalScore - a.totalScore)
                            .map((res, i) => {
                                const player = currentRoom?.players?.find((p) => p.id === res.playerId);
                                return (
                                    <div key={res.playerId} className={styles.lbRow}>
                                        <span className={styles.lbRank}>#{i + 1}</span>
                                        <div className={styles.lbPlayer}>
                                            <span>{player?.login || 'Player'}</span>
                                            {res.streak > 1 && <span>🔥 x{res.streak}</span>}
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
        </div>
    );
};

export default PartyHostPage;
