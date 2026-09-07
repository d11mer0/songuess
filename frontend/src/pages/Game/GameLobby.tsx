import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGameRoom } from '../../hooks/GameRoom/useGameRoom';
import styles from '../../components/Game/Lobby/SearchLobby/LobbyControls.module.css';
import LobbyControls from '../../components/Game/Lobby/SearchLobby/LobbyControls';
import RoomList from '../../components/Game/Lobby/SearchLobby/RoomList';
import CurrentRoom from '../../components/Game/Lobby/JoinedLobby/CurrentRoom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { useTranslation } from '../../i18n/LanguageContext';

const GameLobby = () => {
    const { t } = useTranslation();
    const roomInfo = useAppSelector(selectCurrentRoom);
    const [searchParams, setSearchParams] = useSearchParams();
    const joinParam = searchParams.get('join');

    const {
        createRoom,
        joinRoom,
        leaveRoom,
        autoJoinRoom,
        startGame,
        kickMember,
    } = useGameRoom();

    useEffect(() => {
        if (joinParam && !roomInfo) {
            joinRoom(joinParam.trim().toUpperCase());
            const next = new URLSearchParams(window.location.search);
            next.delete('join');
            setSearchParams(next, { replace: true });
        }
    }, [joinParam, roomInfo, joinRoom]);

    return (
        <div className={styles.container}>
            <h1 style={{
                marginBottom: '32px',
                fontSize: '40px',
                letterSpacing: '2px',
                background: 'linear-gradient(135deg, #00f3ff, #9b5de5, #f15bb5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 900
            }}>
                {t('lobby.title')}
            </h1>
            {!roomInfo ? (
                <>
                    <LobbyControls
                        createRoom={createRoom}
                        autoJoinRoom={autoJoinRoom}
                    />
                    <RoomList joinRoom={joinRoom} />
                </>
            ) : (
                <CurrentRoom
                    startGame={startGame}
                    leaveRoom={leaveRoom}
                    kickMember={kickMember}
                />
            )}
        </div>
    );
};

export default GameLobby;