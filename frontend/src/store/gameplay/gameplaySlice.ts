import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, RoomState } from '../../types/roomTypes';
import { GameRoundPublicData } from '../../types/gameTypes';

interface RoundResult {
    correctAnswer: string;
    answer: string;
    timeTaken: number;
    isCorrect: boolean;
}

interface GameplayState {
    currentRoom: Room | null;
    rooms: Room[];
    trackInfo: GameRoundPublicData | null;
    roundResult: RoundResult | null;
    initialAnswer: string | null;
}

const initialState: GameplayState = {
    currentRoom: null,
    rooms: [],
    trackInfo: null,
    roundResult: null,
    initialAnswer: null,
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
    endGame,
    setRooms
} = gameplaySlice.actions;

export default gameplaySlice.reducer;