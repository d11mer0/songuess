import { useEffect, useCallback } from 'react';
import { socketEmitter, socketHandlers } from '../../services/socket';
import { Room, RoomState } from '../../types/roomTypes';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useAppDispatch } from '../../store/hooks';
import { socketOffMany } from '../../utils/socketUtils/socketOffMany';
import { setCurrentRoom, setRooms } from '../../store/gameplay/gameplaySlice';
import { mapBackendRoomToFrontend } from '../../utils/mapBackendRoomToFrontend';

interface UseGameRoomListenersProps {
    updateSearchParams: (id: string | null) => void;
}

export const useGameRoomListeners = ({updateSearchParams}: UseGameRoomListenersProps) => {
    const { user } = useSelector((state: RootState) => state.user);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    
    const handleRoomsUpdate = useCallback(
        (data: Room[]) => {
            dispatch(setRooms(data));
        },
        [dispatch],
    );

    const handleGameStarted = useCallback(
        (data: Room) => {
            dispatch(setCurrentRoom(mapBackendRoomToFrontend(data)));
            navigate(`/game/${data.id}`);
            socketOffMany([
                'playerDisconnected', 
                'playerLeft', 
                'gameStarted',            
                'roomCreated', 
                'joinedRoom', 
                'roomsList',
                'roomDeleted',
            ]);
        },
        [navigate, dispatch],
    );

    const handlePlayerLeft = useCallback(
        (room: Room) => {
            if (!room) return;
            const wasKicked = !room.players?.some(
                (player) => String(player.id) === String(user?.id),
            );
            dispatch(setCurrentRoom(wasKicked ? null : mapBackendRoomToFrontend(room)));
            socketEmitter.emit('getRooms');
        },
        [dispatch, user?.id],
    );

    const handlePlayerDisconnected = useCallback(
        (room: Room) => {
            if (room) {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
            }
        },
        [dispatch],
    );

    const handleRoomDeleted = useCallback(
        (data: { roomId?: string }) => {
            dispatch(setCurrentRoom(null));
            socketEmitter.emit('getRooms');
        },
        [dispatch],
    );

    const handleRoomCreated = useCallback(
        (data: Room) => {
            if (!data) return;
            dispatch(setCurrentRoom(mapBackendRoomToFrontend(data)));

            if (data.lobbyOptions?.isPartyMode) {
                navigate(`/party/host/${data.id}`);
                return;
            }
        },
        [dispatch, navigate],
    );

    const handleJoinedRoom = useCallback(
        (data: Room) => {
            if (data) {
                if (data.lobbyOptions?.isPartyMode) {
                    const isLeader = Boolean(user?.id && data.leaderId && String(user.id) === String(data.leaderId));
                    if (isLeader) {
                        navigate(`/party/host/${data.id}`);
                    } else {
                        navigate(`/play/${data.shortCode || data.id}`);
                    }
                    return;
                }
                if (data.state !== RoomState.ADDING) {
                    navigate(`/game/${data.id}`);
                    return;
                }
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(data)));
            } else {
                dispatch(setCurrentRoom(null));
            }
        },
        [navigate, dispatch, user?.id],
    );

    const handleDuelMatchFound = useCallback(
        (data: { roomId: string; room: Room }) => {
            dispatch(setCurrentRoom(mapBackendRoomToFrontend(data.room)));
            navigate(`/game/${data.roomId}`);
            socketOffMany([
                'playerDisconnected',
                'playerLeft',
                'gameStarted',
                'roomCreated',
                'joinedRoom',
                'roomsList',
                'roomDeleted',
                'partyModeSwitched',
                'duelMatchFound',
            ]);
        },
        [navigate, dispatch],
    );

    const handlePartyModeSwitched = useCallback(
        (data: { roomId: string; shortCode?: string; isPartyMode: boolean; room?: any }) => {
            if (data.room) {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(data.room)));
            }
            if (data.isPartyMode) {
                const leaderId = data.room?.leaderId;
                const isLeader = Boolean(user?.id && leaderId && String(user.id) === String(leaderId));
                if (isLeader) {
                    navigate(`/party/host/${data.roomId}`);
                } else {
                    const code = data.shortCode || data.roomId;
                    navigate(`/play/${code}`);
                }
            }
        },
        [dispatch, navigate, user?.id],
    );

    useEffect(() => {
        socketHandlers.on('roomCreated', handleRoomCreated);
        socketHandlers.on('joinedRoom', handleJoinedRoom);
        socketHandlers.on('roomsList', handleRoomsUpdate);
        socketHandlers.on('duelMatchFound', handleDuelMatchFound);
        socketHandlers.on('playerLeft', handlePlayerLeft);
        socketHandlers.on('playerDisconnected', handlePlayerDisconnected);
        socketHandlers.on('roomDeleted', handleRoomDeleted);
        socketHandlers.on('gameStarted', handleGameStarted);
        socketHandlers.on('partyModeSwitched', handlePartyModeSwitched);

        return () => {
            socketOffMany([
                'roomCreated',
                'joinedRoom',
                'roomsList',
                'duelMatchFound',
                'playerLeft',
                'playerDisconnected',
                'roomDeleted',
                'gameStarted',
                'partyModeSwitched',
            ]);
        };
    }, [
        handleRoomCreated,
        handleJoinedRoom,
        handleRoomsUpdate,
        handleDuelMatchFound,
        handlePlayerLeft,
        handlePlayerDisconnected,
        handleRoomDeleted,
        handleGameStarted,
        handlePartyModeSwitched,
    ]);
};
