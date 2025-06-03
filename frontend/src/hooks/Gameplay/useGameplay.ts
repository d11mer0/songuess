import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socketInstance, socketEmitter } from '../../services/socket';
import { useGameplayListeners } from './useGameplayListeners';
import { } from '../../types/roomTypes';
import { SelectedTracks } from '../../types/gameTypes';
import { selectCurrentRoom, selectTrackInfo } from '../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../store/hooks';
import { createKickMember } from '../../utils/socketUtils/createKickMember';
import { useSocketConnection } from '../common/useSocketConnection';

export const useGameplay = () => {
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

    return {
        kickMember,
        deleteRoom,
        launchGame,
        submitAnswer
    };
};
