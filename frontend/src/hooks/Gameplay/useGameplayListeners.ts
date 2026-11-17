import { useCallback, useEffect, useRef } from 'react';
import { socketEmitter, socketHandlers } from '../../services/socket';
import { Room, RoomState } from '../../types/roomTypes';
import { useNavigate } from 'react-router-dom';

import { GameRoundPublicData} from '../../types/gameTypes';
import { GameEndedPayload } from '../../types/gameEndedTypes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';

import {
    setCurrentRoom,
    setRoundResult,
    endGame,
    startRound,
    reconnectToRound,
    setGameEndedData,
} from '../../store/gameplay/gameplaySlice';
import { clearRoomSessionStorage } from '../../utils/storage/clearRoomSessionStorage';
import { updateServerClockOffset } from '../../utils/calculateStartTime';
import { mapBackendRoomToFrontend } from '../../utils/mapBackendRoomToFrontend';

interface RoundTrackWithoutPreview {
    id: string;
    title: string;
    artistName?: string;
    albumName?: string;
}

const matchesRouteRoom = (room: Room, targetId?: string): boolean => {
    if (!targetId) return true;
    const norm = targetId.trim();
    if (!norm) return true;
    if (room.id.toLowerCase() === norm.toLowerCase()) return true;
    if (room.shortCode && room.shortCode.toUpperCase() === norm.toUpperCase()) return true;
    return false;
};

export const useGameplayListeners = (routeRoomId?: string) => {

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.user);
    const currentRoom = useAppSelector(selectCurrentRoom);

    const currentRoomRef = useRef(currentRoom);
    currentRoomRef.current = currentRoom;
    const routeRoomIdRef = useRef(routeRoomId);
    routeRoomIdRef.current = routeRoomId;
    const joinAttemptedForIdRef = useRef<string | null>(null);

    useEffect(() => {
        joinAttemptedForIdRef.current = null;
    }, [routeRoomId]);

    const attemptJoinRouteRoom = useCallback((): boolean => {
        const targetId = routeRoomIdRef.current?.trim();
        if (!targetId) return false;
        if (currentRoomRef.current && matchesRouteRoom(currentRoomRef.current, targetId)) {
            return false;
        }
        if (joinAttemptedForIdRef.current === targetId) {
            return false;
        }
        joinAttemptedForIdRef.current = targetId;
        socketEmitter.emit('joinRoom', { id: targetId });
        return true;
    }, []);

    const handleReconnectToRound = useCallback(
        (payload: GameRoundPublicData & { answer: string | null; heardleUnlockedTier?: number }) => {
            updateServerClockOffset(payload?.serverTime);
            dispatch(reconnectToRound(payload));
        },
        [dispatch, currentRoom?.id],
    );

    const handleSetTrackInfo = useCallback (
        (payload: GameRoundPublicData) => {
            updateServerClockOffset(payload?.serverTime);
            if (currentRoom?.lobbyOptions?.isPartyMode && user?.id && currentRoom?.leaderId && String(user.id) !== String(currentRoom.leaderId)) {
                const code = currentRoom.shortCode || currentRoom.id;
                navigate(`/play/${code}`);
                return;
            }
            dispatch(startRound(payload));
        },
        [dispatch, currentRoom, user, navigate],
    );

    const handlePartyModeSwitched = useCallback(
        (data: { roomId: string; shortCode?: string; isPartyMode: boolean; room?: any }) => {
            if (data.room) {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(data.room)));
            }
            if (data.isPartyMode) {
                const leaderId = data.room?.leaderId || currentRoom?.leaderId;
                const isLeader = Boolean(user?.id && leaderId && String(user.id) === String(leaderId));
                if (isLeader) {
                    navigate(`/party/host/${data.roomId}`);
                } else {
                    const code = data.shortCode || data.roomId;
                    navigate(`/play/${code}`);
                }
            }
        },
        [dispatch, navigate, user?.id, currentRoom?.leaderId],
    );

    const handleRoomDeleted = useCallback(
        (data: { roomId?: string; error?: string }) => {
            if (data?.roomId) {
                dispatch(setCurrentRoom(null));
                navigate('/game');
                socketEmitter.emit('getRooms');
            }
        },
        [navigate, dispatch],
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
                streak?: number;
            }[];
            streaks?: Record<number, number>;
        }) => {
            const { correctAnswer, results, streaks } = data;
            const mappedResults = results.map(r => ({
                ...r,
                isCorrect: Boolean((r as any).isCorrect ?? (r.score > 0 || (r.answer && r.answer === correctAnswer)))
            }));
            const myResult = mappedResults.find(r => r.playerId === user?.id);
            if(!myResult) { return };
            dispatch(setRoundResult({
                correctAnswer,
                results: mappedResults,
                myResult,
                streaks,
            }));
        },
        [dispatch, user?.id],
    );

    const handleGameEnded = useCallback(
        (resultPayload: GameEndedPayload) => {
            clearRoomSessionStorage(resultPayload.roomId || currentRoom?.id);
            dispatch(setGameEndedData(resultPayload));
            dispatch(endGame());
        },
        [dispatch, currentRoom?.id],
    );

    const handlePlayerLeft = useCallback(
        (room: Room) => {
            if (!room) return;
            const wasKicked = !room.players?.some(
                (player) => player.id === user?.id,
            );
            if (wasKicked) {
                clearRoomSessionStorage(room.id);
                dispatch(setCurrentRoom(null));
                navigate('/game');
                socketEmitter.emit('getRooms');
            } else {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
            }
        },
        [dispatch, navigate, user?.id],
    );

    const handlePlayerDisconnected = useCallback(
        (room: Room) => {
            if (room) {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
            }
        },
        [dispatch],
    );

    const handleJoinedRoom = useCallback(
        (room: Room | null) => {
            if (!room) {
                dispatch(setCurrentRoom(null));
                navigate('/game');
                return;
            }
            dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
            if (room.lobbyOptions?.isPartyMode) {
                const leaderId = room.leaderId || currentRoomRef.current?.leaderId;
                const isLeader = Boolean(user?.id && leaderId && String(user.id) === String(leaderId));
                if (isLeader) {
                    navigate(`/party/host/${room.id}`);
                } else {
                    const code = room.shortCode || room.id;
                    navigate(`/play/${code}`);
                }
                return;
            }
            if (room.state === RoomState.ADDING) {
                navigate('/game');
            }
        },
        [navigate, dispatch, user?.id],
    );

    const handleCurrentRoom = useCallback(
        (room: Room | null) => {
            const targetId = routeRoomIdRef.current?.trim();
            if (room && matchesRouteRoom(room, targetId)) {
                dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
                if (room.lobbyOptions?.isPartyMode) {
                    const leaderId = room.leaderId || currentRoomRef.current?.leaderId;
                    const isLeader = Boolean(user?.id && leaderId && String(user.id) === String(leaderId));
                    navigate(isLeader ? `/party/host/${room.id}` : `/play/${room.shortCode || room.id}`);
                    return;
                }
                if (room.state === RoomState.ADDING) {
                    navigate('/game');
                }
                return;
            }

            if (targetId) {
                attemptJoinRouteRoom();
            } else {
                navigate('/game');
            }
        },
        [attemptJoinRouteRoom, dispatch, navigate, user?.id],
    );

    // If room is in TV / party mode, automatically route host to TV and player to gamepad
    useEffect(() => {
        if (currentRoom?.lobbyOptions?.isPartyMode && currentRoom.leaderId) {
            const isLeader = Boolean(user?.id && String(user.id) === String(currentRoom.leaderId));
            if (isLeader) {
                navigate(`/party/host/${currentRoom.id}`);
            } else {
                const code = currentRoom.shortCode || currentRoom.id;
                navigate(`/play/${code}`);
            }
        }
    }, [currentRoom?.id, currentRoom?.leaderId, currentRoom?.lobbyOptions?.isPartyMode, user?.id, navigate]);

    const handleGameRestarted = useCallback((room: Room) => {
        clearRoomSessionStorage(room?.id);
        dispatch(setGameEndedData(null));
        if (room) {
            dispatch(setCurrentRoom(mapBackendRoomToFrontend(room)));
        }
    }, [dispatch]);

    useEffect(() => {
        const handleReconnectFailed = () => {
            if (routeRoomIdRef.current?.trim()) {
                attemptJoinRouteRoom();
            } else {
                navigate('/game');
            }
        };

        socketHandlers.on('roundStarted', handleSetTrackInfo);
        socketHandlers.on('joinedRoom', handleJoinedRoom);
        socketHandlers.on('currentRoom', handleCurrentRoom);
        socketHandlers.on('reconnectToRound', handleReconnectToRound);
        socketHandlers.on('gameRestarted', handleGameRestarted);
        socketHandlers.on('partyModeSwitched', handlePartyModeSwitched);
        socketHandlers.on('reconnectFailed', handleReconnectFailed);
        socketHandlers.on('gameEnded', handleGameEnded);
        socketHandlers.on('roundResult', handleRoundEnded);
        socketHandlers.on('playerLeft', handlePlayerLeft);
        socketHandlers.on('playerDisconnected', handlePlayerDisconnected);
        socketHandlers.on('roomDeleted', handleRoomDeleted);

        return () => {
            socketHandlers.off('roundStarted', handleSetTrackInfo);
            socketHandlers.off('joinedRoom', handleJoinedRoom);
            socketHandlers.off('currentRoom', handleCurrentRoom);
            socketHandlers.off('reconnectToRound', handleReconnectToRound);
            socketHandlers.off('gameRestarted', handleGameRestarted);
            socketHandlers.off('partyModeSwitched', handlePartyModeSwitched);
            socketHandlers.off('reconnectFailed', handleReconnectFailed);
            socketHandlers.off('gameEnded', handleGameEnded);
            socketHandlers.off('roundResult', handleRoundEnded);
            socketHandlers.off('playerLeft', handlePlayerLeft);
            socketHandlers.off('playerDisconnected', handlePlayerDisconnected);
            socketHandlers.off('roomDeleted', handleRoomDeleted);
        };
    }, [
        attemptJoinRouteRoom,
        handleCurrentRoom,
        handleSetTrackInfo,
        handleJoinedRoom,
        handleReconnectToRound,
        handleGameRestarted,
        handlePartyModeSwitched,
        handleGameEnded,
        handleRoundEnded,
        handlePlayerLeft,
        handlePlayerDisconnected,
        handleRoomDeleted,
        navigate,
    ]);
};
