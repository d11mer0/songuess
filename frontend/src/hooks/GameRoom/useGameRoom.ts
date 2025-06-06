import { useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    socketEmitter,
} from '../../services/socket';
import { useGameRoomListeners } from './useGameRoomListeners';
import { LobbyOptions} from '../../types/roomTypes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createKickMember } from '../../utils/socketUtils/createKickMember';
import { useSocketConnection } from '../common/useSocketConnection';
import { socketOffMany } from '../../utils/socketUtils/socketOffMany';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { setCurrentRoom } from '../../store/gameplay/gameplaySlice';

export const useGameRoom = () => {
    const dispatch = useAppDispatch();
    const roomInfo = useAppSelector(selectCurrentRoom);
   
    const kickMember = createKickMember(roomInfo?.id);
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const updateSearchParams = useCallback(
        (id: string | null) => {
            if (!id) {
                navigate('/game', { replace: true });
            } else if (searchParams.get('room') !== id) {
                navigate(`/game?room=${id}`, { replace: true });
            }
        },
        [navigate],
    );
    
    useSocketConnection();
    useGameRoomListeners({updateSearchParams});
    useEffect(() => { socketEmitter.emit('getRooms') }, []);
    
    const createRoom = useCallback((lobbyOptions: LobbyOptions) => {
        socketEmitter.emit('createRoom', lobbyOptions);
    }, []);

    const joinRoom = useCallback((id: string) => {
        socketEmitter.emit('joinRoom', { id });
    }, []);

    const leaveRoom = useCallback(() => {
        if (roomInfo) {
            socketEmitter.emit('leaveRoom', { id: roomInfo.id });
            dispatch(setCurrentRoom(null));
            updateSearchParams(null);
            socketOffMany(['playerDisconnected', 'playerLeft', 'gameStarted']);

        }
    }, [roomInfo, updateSearchParams]);

    const autoJoinRoom = useCallback(() => {
        socketEmitter.emit('autoJoinRoom');
    }, []);

    const startGame = useCallback(() => {
        if (roomInfo) {
            socketEmitter.emit('startGame', { id: roomInfo.id });
        }
    }, [roomInfo]);

    return {
        createRoom,
        joinRoom,
        leaveRoom,
        autoJoinRoom,
        startGame,
        kickMember,
    };
};
