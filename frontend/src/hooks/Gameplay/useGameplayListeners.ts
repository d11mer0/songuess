import { useCallback, useEffect } from 'react';
import { socketHandlers,} from '../../services/socket';
import { Room, RoomState } from '../../types/roomTypes';
import { useNavigate } from 'react-router-dom';

import { GameRoundPublicData} from '../../types/gameTypes';
import { GameEndedPayload } from '../../types/gameEndedTypes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import {
    setCurrentRoom,
    setRoundResult,
    endGame,
    startRound,
    reconnectToRound,
    setGameEndedData,
    changeRoomState
} from '../../store/gameplay/gameplaySlice';
import { socketOffMany } from '../../utils/socketUtils/socketOffMany';
import { mapBackendRoomToFrontend } from '../../utils/mapBackendRoomToFrontend';

interface RoundTrackWithoutPreview {
    id: string;
    title: string;
    artistName?: string;
    albumName?: string;
}

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
            results: {
                playerId: number;
                answer: string;
                score: number;
                totalScore: number;
                timeTaken: number;
            }[];
        }) => {
            const { correctAnswer, results } = data;
            const mappedResults = results.map(r => ({
                ...r,
                isCorrect: r.answer === correctAnswer
            }));
            const myResult = mappedResults.find(r => r.playerId === user?.id);
            if(!myResult) { return };
            dispatch(setRoundResult({
                correctAnswer,
                results: mappedResults,
                myResult
            }));
        },
        [dispatch],
    );

    const handleGameEnded = useCallback(
        (resultPayload: GameEndedPayload) => { 
            dispatch(setGameEndedData(resultPayload)); // ✅ зберігаємо в стейт
            dispatch(endGame()); // змінюємо статус кімнати
        },
        [dispatch],
    );

    const handlePlayerLeft = useCallback(
        (room: Room) => {
            const wasKicked = !room.players.some(
                (player) => player.id === user?.id,
            );
            wasKicked 
                ? dispatch(setCurrentRoom(null)) 
                : dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
            
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
        (room: Room) => {

            if (room && room.state !== RoomState.ADDING) {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
                socketHandlers.on('gameEnded', handleGameEnded);
                socketHandlers.on('roundResult', handleRoundEnded);
                socketHandlers.on('playerLeft', handlePlayerLeft);
                socketHandlers.on('playerDisconnected', (room) => {
                    dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
            });
                socketHandlers.on('roomDeleted', handleRoomDeleted);
            } else {
                navigate('/game');
            }
        },
        [navigate, dispatch],
    );

    const handleGameRestarted = useCallback((room: Room) => {
        dispatch(setGameEndedData(null));          // ✅ очистка результатів
        dispatch(changeRoomState(RoomState.CREATING)); // ✅ оновлюємо стан кімнати
        dispatch(setCurrentRoom(room));            // оновлюємо інформацію про кімнату (гравці ті самі)
    }, [dispatch]);

    useEffect(() => {
        socketHandlers.on('roundStarted', handleSetTrackInfo);
        socketHandlers.on('joinedRoom', handleJoinedRoom);
        socketHandlers.on('reconnectToRound', handleReconnectToRound);
        socketHandlers.on('gameRestarted', handleGameRestarted);
        return () => {
            socketOffMany(['joinedRoom', 'roundStarted', 'reconnectToRound', 'gameRestarted']);
        };
    }, [handleJoinedRoom]);
};
