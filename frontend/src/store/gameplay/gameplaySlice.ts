import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, RoomState } from '../../types/roomTypes';
import { GameRoundPublicData } from '../../types/gameTypes';
import { GameplayState, RoundResult } from './types';
import { GameEndedPayload } from '../../types/gameEndedTypes';

const initialState: GameplayState = {
    currentRoom: null,
    rooms: [],
    trackInfo: null,
    roundResult: null,
    initialAnswer: null,
    gameEndedData: null
};

const gameplaySlice = createSlice({
    name: 'gameplay',
    initialState,
    reducers: {
        setCurrentRoom(state, action: PayloadAction<Room | null>) {
            state.currentRoom = action.payload;
        },
        setTrackInfo(state, action: PayloadAction<GameRoundPublicData | null>) {
            state.trackInfo = action.payload;
            state.roundResult = null;
        },
        setRoundResult(state, action: PayloadAction<RoundResult | null>) {
            state.roundResult = action.payload;

            if (action.payload && state.currentRoom) {
                const resultsMap = new Map<number, number>();
                for (const r of action.payload.results) {
                    resultsMap.set(r.playerId, r.totalScore ?? 0);
                }

                state.currentRoom.players = state.currentRoom.players.map(p => ({
                    ...p,
                    totalScore: resultsMap.has(p.id) ? resultsMap.get(p.id) : (p.totalScore ?? 0),
                }));
            }
        },
        setInitialAnswer(state, action: PayloadAction<string | null>) {
            state.initialAnswer = action.payload;
        },
        changeRoomState(state, action: PayloadAction<RoomState>) {
            if (state.currentRoom) {
                state.currentRoom.state = action.payload;
            }
        },
        resetGameplayState() {
            return initialState;
        },
        startRound(state, action: PayloadAction<GameRoundPublicData>) {
            state.trackInfo = action.payload;
            state.initialAnswer = null;
            state.roundResult = null;
            if (action.payload.roundNumber === 0 && state.currentRoom) {
                state.currentRoom.state = RoomState.STARTED;
            }
        },
        reconnectToRound(state, action: PayloadAction<GameRoundPublicData & { answer: string | null }>) {
            state.trackInfo = action.payload;
            state.initialAnswer = action.payload.answer;
            state.roundResult = null;
        },

        setGameEndedData(state, action: PayloadAction<GameEndedPayload | null>) {
            state.gameEndedData = action.payload;
        },
        endGame(state) {
            state.trackInfo = null;
            state.roundResult = null;
            state.initialAnswer = null;
            if (state.currentRoom) {
                state.currentRoom.state = RoomState.ENDED;
            }
        },

        setRooms(state, action: PayloadAction<Room[]>) {
            state.rooms = action.payload;
        }
    },
});

export const {
    setCurrentRoom,
    setTrackInfo,
    setRoundResult,
    setInitialAnswer,
    resetGameplayState,
    changeRoomState,
    startRound,
    reconnectToRound,
    setGameEndedData,
    endGame,
    setRooms
} = gameplaySlice.actions;

export default gameplaySlice.reducer;