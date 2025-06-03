import { useCallback, useEffect } from 'react';
import { socketHandlers,} from '../../services/socket';
import { Room, RoomState } from '../../types/roomTypes';
import { useNavigate } from 'react-router-dom';

import { GameRoundPublicData} from '../../types/gameTypes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    setCurrentRoom,
    setRoundResult,
    endGame,
    startRound,
    reconnectToRound
} from '../../store/gameplay/gameplaySlice';
import { socketOffMany } from '../../utils/socketUtils/socketOffMany';

export const useGameplayListeners = () => {

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.user);

    const handleReconnectToRound = useCallback(
        (payload: GameRoundPublicData & { answer: string | null }) => {
            dispatch(reconnectToRound(payload));
        },
        [dispatch],
    );

    const handleSetTrackInfo = useCallback (
        (payload: GameRoundPublicData) => {
            dispatch(startRound(payload));
        },
        [dispatch],
    );

    const handleRoomDeleted = useCallback(
        (data: { roomId?: string; error?: string }) => {
            if (data.roomId) {
                navigate('/game');
            }
        },
        [navigate],
    );

    const handleRoundEnded = useCallback(
        (data: {
            correctAnswer: string;
            answer: string;
            timeTaken: number;
        }) => {
            const { correctAnswer, answer, timeTaken } = data;

            dispatch(setRoundResult({
                correctAnswer,
                answer,
                timeTaken,
                isCorrect: answer === correctAnswer,
            }));
        },
        [dispatch],
    );

    const handleGameEnded = useCallback(
        () => { dispatch(endGame())},
        [dispatch],
    );

    const handlePlayerLeft = useCallback(
        (room: Room) => {
            const wasKicked = !room.players.some(
                (player) => player.id === user?.id,
            );
            dispatch(setCurrentRoom(wasKicked ? null : room));
            if (wasKicked) {
                socketOffMany([
                    'playerDisconnected', 
                    'message', 
                    'roomDeleted', 
                    'roundStarted', 
                    'roundResult'
                ]);

                navigate('/game');
            }
        },
        [dispatch, navigate, user?.id],
    );

    const handleJoinedRoom = useCallback(
        (data: Room) => {
            if (data && data.state !== RoomState.ADDING) {
                dispatch(setCurrentRoom(data));
                socketHandlers.on('gameEnded', handleGameEnded);
                socketHandlers.on('roundResult', handleRoundEnded);
                socketHandlers.on('playerLeft', handlePlayerLeft);
                socketHandlers.on('playerDisconnected', (room) =>
                    dispatch(setCurrentRoom(room))
                );
                socketHandlers.on('roomDeleted', handleRoomDeleted);
            } else {
                navigate('/game');
            }
        },
        [navigate, dispatch],
    );

    useEffect(() => {
        socketHandlers.on('roundStarted', handleSetTrackInfo);
        socketHandlers.on('joinedRoom', handleJoinedRoom);
        socketHandlers.on('reconnectToRound', handleReconnectToRound);
        return () => {
            socketOffMany(['joinedRoom', 'roundStarted', 'reconnectToRound']);
        };
    }, [handleJoinedRoom]);
};
