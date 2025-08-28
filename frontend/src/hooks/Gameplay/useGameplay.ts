import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socketInstance, socketEmitter, socketHandlers } from '../../services/socket';
import { useGameplayListeners } from './useGameplayListeners';
import { } from '../../types/roomTypes';
import { SelectedTracks } from '../../types/gameTypes';
import { selectCurrentRoom, selectTrackInfo } from '../../store/gameplay/gameplaySelectors';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createKickMember } from '../../utils/socketUtils/createKickMember';
import { useSocketConnection } from '../common/useSocketConnection';
import { setCurrentRoom, setRooms } from '../../store/gameplay/gameplaySlice';
import { socketOffMany } from '../../utils/socketUtils/socketOffMany';

export const useGameplay = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id: roomId } = useParams<{ id?: string }>();
    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);
    
    const kickMember = createKickMember(currentRoom?.id);
    
    useSocketConnection();
    useGameplayListeners();

    const deleteRoom = () => {
        if (roomId) socketEmitter.emit('deleteRoom', { id: roomId });
    };

    const launchGame = useCallback(
        (selectedTracks: SelectedTracks) => {
            if (roomId) {
                socketEmitter.emit('launchGame', {
                    roomId: roomId,
                    selectedTracks,
                });
            }
        },
        [roomId],
    );

    const submitAnswer = useCallback(
        (option: string) => {
            if (!currentRoom || !trackInfo) return;

            socketEmitter.emit('submitAnswer', {
                roomId: currentRoom.id,
                roundNumber: trackInfo.roundNumber,
                answer: option,
            });
        },
        [currentRoom, trackInfo],
    );

    const leaveRoom = useCallback(() => {
        if (currentRoom) {                   
            socketEmitter.emit('leaveRoom', { id: currentRoom.id });
            dispatch(setCurrentRoom(null));
            socketOffMany([
                'playerDisconnected', 
                'message', 
                'roomDeleted', 
                'roundStarted', 
                'roundResult', 
                'gameRestarted' 
            ]);
            
            socketHandlers.on('roomsList', (rooms) => {
                dispatch(setRooms(rooms));
            });
            navigate('/game');
            socketEmitter.emit('getRooms');
            
        }
    }, [currentRoom]);

    const restartGame = () => {
        if (roomId) {
            socketEmitter.emit('restartGame', { roomId });
        }
    };

    return {
        kickMember,
        deleteRoom,
        launchGame,
        submitAnswer,
        leaveRoom,
        restartGame
    };
};
