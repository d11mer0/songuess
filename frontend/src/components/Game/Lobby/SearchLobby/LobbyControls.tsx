import { useState, useEffect } from 'react';
import { LobbyOptions, GameMode, AnswerMode } from '../../../../types/roomTypes';
import styles from './LobbyControls.module.css';
import Checkboxes from './LobbyControls/Checkboxes';
import MaxPlayersInput from './LobbyControls/MaxPlayersInput';
import ActionButtons from './LobbyControls/ActionButtons';
import { socketEmitter, socketHandlers } from '../../../../services/socket';
import { useTranslation } from '../../../../i18n/LanguageContext';

interface Props {
    createRoom: (options: LobbyOptions) => void;
    autoJoinRoom: () => void;
}

const LobbyControls = ({ createRoom, autoJoinRoom }: Props) => {
    const { t } = useTranslation();
    const [lobbyOptions, setLobbyOptions] = useState<LobbyOptions>({
        allowAutoJoin: true,
        publicLobby: true,
        maxPlayers: 3,
        gameMode: 'CLASSIC',
        answerMode: 'MULTIPLE_CHOICE',
        roundDuration: 25,
    });

    const [isSearchingDuel, setIsSearchingDuel] = useState<boolean>(false);
    const [joinCode, setJoinCode] = useState<string>('');

    useEffect(() => {
        const handleDuelStatus = (data: { status: string; queueSize?: number }) => {
            if (data.status === 'WAITING') {
                setIsSearchingDuel(true);
            } else {
                setIsSearchingDuel(false);
            }
        };

        socketHandlers.on('duelQueueStatus', handleDuelStatus);
        socketHandlers.on('duelMatchFound', () => setIsSearchingDuel(false));
        socketHandlers.on('duelError', () => setIsSearchingDuel(false));

        return () => {
            socketHandlers.off('duelQueueStatus');
            socketHandlers.off('duelMatchFound');
            socketHandlers.off('duelError');
        };
    }, []);

    const handleChange = (field: keyof LobbyOptions) =>
        setLobbyOptions(prev => ({ ...prev, [field]: !prev[field] }));

    const setMaxPlayers = (value: number) =>
        setLobbyOptions(prev => ({ ...prev, maxPlayers: value }));

    const setGameMode = (mode: GameMode) =>
        setLobbyOptions(prev => ({ ...prev, gameMode: mode }));

    const setAnswerMode = (mode: AnswerMode) =>
        setLobbyOptions(prev => ({ ...prev, answerMode: mode }));

    const setRoundDuration = (duration: number) =>
        setLobbyOptions(prev => ({ ...prev, roundDuration: duration }));

    const handleStartDuelSearch = () => {
        setIsSearchingDuel(true);
        socketEmitter.emit('findDuelMatch');
    };

    const handleCancelDuelSearch = () => {
        setIsSearchingDuel(false);
        socketEmitter.emit('cancelDuelMatch');
    };

    const handleJoinByCode = () => {
        const trimmed = joinCode.trim().toUpperCase();
        if (trimmed) {
            socketEmitter.emit('joinRoom', { id: trimmed });
        }
    };

    return (
        <div className={styles.lobbyDashboard}>
            {/* Ліва колонка: Швидкі дії (Дуель + Вхід за кодом) */}
            <div className={styles.quickPlayColumn}>
                {/* ⚡ Блок швидкого підбору 1v1 */}
                <div className={styles.duelSection}>
                    <div className={styles.duelTitle}>{t('lobby.duelTitle')}</div>
                    <div className={styles.duelDesc}>{t('lobby.duelDesc')}</div>

                    {!isSearchingDuel ? (
                        <button className={styles.duelButton} onClick={handleStartDuelSearch}>
                            {t('lobby.duelFindBtn')}
                        </button>
                    ) : (
                        <div className={styles.duelWaitingBox}>
                            <span>{t('lobby.duelSearching')}</span>
                            <button className={styles.duelCancelButton} onClick={handleCancelDuelSearch}>
                                {t('lobby.duelCancelBtn')}
                            </button>
                        </div>
                    )}
                </div>

                {/* 🔑 Швидкий вхід за 4-значним кодом */}
                <div className={styles.codeJoinSection}>
                    <div className={styles.codeJoinTitle}>{t('lobby.codeJoinTitle')}</div>
                    <div className={styles.codeJoinRow}>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder={t('lobby.codePlaceholder')}
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className={styles.codeInput}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && joinCode.trim().length >= 4) {
                                    handleJoinByCode();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className={styles.joinCodeBtn}
                            onClick={handleJoinByCode}
                            disabled={joinCode.trim().length < 4}
                        >
                            {t('lobby.joinBtn')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Права колонка: Створення власної кімнати */}
            <div className={styles.createRoomColumn}>
                <div className={styles.controlsContainer}>
                    <h3 className={styles.sectionTitle}>{t('lobby.createRoomTitle')}</h3>

                    {/* Вибір режиму гри */}
                    <div className={styles.modeSelectContainer}>
                        <label className={styles.modeLabel}>{t('lobby.gameModeLabel')}</label>
                        <div className={styles.modeButtonGroup}>
                            <button
                                type="button"
                                className={`${styles.modeBtn} ${lobbyOptions.gameMode === 'CLASSIC' ? styles.active : ''}`}
                                onClick={() => setGameMode('CLASSIC')}
                            >
                                {t('lobby.modeClassic')}
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeBtn} ${lobbyOptions.gameMode === 'HEARDLE' ? styles.active : ''}`}
                                onClick={() => setGameMode('HEARDLE')}
                            >
                                {t('lobby.modeHeardle')}
                            </button>
                        </div>
                    </div>

                    {/* Вибір формату відповідей */}
                    <div className={styles.modeSelectContainer}>
                        <label className={styles.modeLabel}>{t('lobby.answerModeLabel')}</label>
                        <div className={styles.modeButtonGroup}>
                            <button
                                type="button"
                                className={`${styles.modeBtn} ${lobbyOptions.answerMode === 'MULTIPLE_CHOICE' ? styles.active : ''}`}
                                onClick={() => setAnswerMode('MULTIPLE_CHOICE')}
                            >
                                {t('lobby.modeOptions')}
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeBtn} ${lobbyOptions.answerMode === 'TYPE_IN' ? styles.active : ''}`}
                                onClick={() => setAnswerMode('TYPE_IN')}
                            >
                                {t('lobby.modeHardcore')}
                            </button>
                        </div>
                    </div>

                    {/* Вибір тривалості раунду */}
                    <div className={styles.modeSelectContainer}>
                        <label className={styles.modeLabel}>{t('lobby.roundDurationLabel')}</label>
                        <div className={styles.durationButtonGroup}>
                            {[5, 10, 15, 20, 25, 30].map((sec) => (
                                <button
                                    key={sec}
                                    type="button"
                                    className={`${styles.durationBtn} ${(lobbyOptions.roundDuration ?? 25) === sec ? styles.active : ''}`}
                                    onClick={() => setRoundDuration(sec)}
                                >
                                    {sec}{t('common.secondsShort')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Checkboxes options={lobbyOptions} onToggle={handleChange} />
                    <MaxPlayersInput maxPlayers={lobbyOptions.maxPlayers} onChange={setMaxPlayers} />
                    <button
                        type="button"
                        onClick={() => createRoom({
                            ...lobbyOptions,
                            maxPlayers: 12,
                            isPartyMode: true,
                        })}
                        style={{
                            width: '100%',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 243, 255, 0.5)',
                            background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.15), rgba(155, 93, 229, 0.25))',
                            color: '#00f3ff',
                            fontSize: '15px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '16px',
                            boxShadow: '0 4px 16px rgba(0, 243, 255, 0.15)',
                        }}
                    >
                        {t('party.partyModeBtn')}
                    </button>
                    <ActionButtons
                        onAutoJoin={autoJoinRoom}
                        onCreateRoom={createRoom}
                        options={lobbyOptions}
                    />
                </div>
            </div>
        </div>
    );
};

export default LobbyControls;
