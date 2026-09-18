import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socketEmitter } from '../../services/socket';
import { useGameplayListeners } from './useGameplayListeners';
import { SelectedTracks } from '../../types/gameTypes';
import { selectCurrentRoom, selectTrackInfo } from '../../store/gameplay/gameplaySelectors';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useSocketConnection } from '../common/useSocketConnection';
import { setCurrentRoom } from '../../store/gameplay/gameplaySlice';
import { socketOffMany } from '../../utils/socketUtils/socketOffMany';

export const useGameplay = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id: roomId } = useParams<{ id?: string }>();
    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);
    
    useSocketConnection();
    useGameplayListeners();

    const kickMember = useCallback((memberId: number) => {
        if (currentRoom?.id) {
            socketEmitter.emit('kickMember', {
                roomId: currentRoom.id,
                memberId,
            });
        }
    }, [currentRoom?.id]);

    const deleteRoom = useCallback(() => {
        if (roomId) socketEmitter.emit('deleteRoom', { id: roomId });
    }, [roomId]);

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
        (option: string, snippetDurationUsed?: number) => {
            if (!currentRoom || !trackInfo) return;

            socketEmitter.emit('submitAnswer', {
                roomId: currentRoom.id,
                roundNumber: trackInfo.roundNumber,
                answer: option,
                snippetDurationUsed,
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
            navigate('/game');
            socketEmitter.emit('getRooms');
        }
    }, [currentRoom, dispatch, navigate]);

    const restartGame = useCallback(() => {
        if (roomId) {
            socketEmitter.emit('restartGame', { roomId });
        }
    }, [roomId]);

    return {
        kickMember,
        deleteRoom,
        launchGame,
        submitAnswer,
        leaveRoom,
        restartGame
    };
};
