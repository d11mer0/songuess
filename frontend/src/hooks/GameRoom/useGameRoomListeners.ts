import { useEffect, useCallback } from 'react';
import { socketEmitter, socketHandlers } from '../../services/socket';
import { Room, RoomState } from '../../types/roomTypes';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useAppDispatch } from '../../store/hooks';
import { socketOffMany } from '../../utils/socketUtils/socketOffMany';
import { setCurrentRoom, setRooms } from '../../store/gameplay/gameplaySlice';
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
            dispatch(setCurrentRoom(data));
            navigate(`/game/${data.id}`);
            socketOffMany([
                'playerDisconnected', 
                'playerLeft', 
                'gameStarted',            
                'roomCreated', 
                'joinedRoom', 
                'roomsList'
            ]);
        },
        [navigate, dispatch],
    );

    const handleRoomCreated = useCallback(
        (data: Room) => {
            dispatch(setCurrentRoom(data));
            //updateSearchParams(data.id);

            socketHandlers.on('playerDisconnected', (room) =>
                dispatch(setCurrentRoom(room))
            );
            socketHandlers.on('playerLeft', handlePlayerLeft);
            socketHandlers.on('gameStarted', handleGameStarted);
            socketOffMany(['roomsList']);
        },
        [updateSearchParams, dispatch, handleGameStarted],
    );

    const handleJoinedRoom = useCallback(
        (data: Room) => {
            if (data) {
                if (data.state !== RoomState.ADDING) {
                    navigate(`/game/${data.id}`);
                    return;
                }
                dispatch(setCurrentRoom(data));
                //updateSearchParams(data.id);
                
                socketHandlers.on('playerDisconnected', (room) =>
                    dispatch(setCurrentRoom(room))
                );
                socketHandlers.on('playerLeft', handlePlayerLeft);
                socketHandlers.on('gameStarted', handleGameStarted);
                socketOffMany(['roomsList']); 
            } else {
                dispatch(setCurrentRoom(null));
                socketHandlers.on('roomsList', handleRoomsUpdate);

            }
        }, [
            navigate,
            updateSearchParams,
            handleGameStarted,
            dispatch
        ],
    );

    const handlePlayerLeft = useCallback(
        (room: Room) => {
            const wasKicked = !room.players.some(
                (player) => player.id === user?.id,
            );
            if (wasKicked) {

                socketOffMany(['playerDisconnected', 'playerLeft', 'gameStarted']);
                socketHandlers.on('roomsList', handleRoomsUpdate);
            }
            dispatch(setCurrentRoom(wasKicked ? null : room));
            socketEmitter.emit('getRooms');
            
        },
        [dispatch, updateSearchParams, user?.id],
    );

    useEffect(() => {
        socketHandlers.on('roomCreated', handleRoomCreated);
        socketHandlers.on('joinedRoom', handleJoinedRoom);
        socketHandlers.on('roomsList', handleRoomsUpdate);

        return () => {
            socketOffMany(['roomCreated', 'joinedRoom', 'roomsList']);
        };
    }, [handleRoomCreated, handleJoinedRoom, handleRoomsUpdate]);
};
