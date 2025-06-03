import { RootState } from '../store';

export const selectCurrentRoom = (state: RootState) => state.gameplay.currentRoom;
export const selectTrackInfo = (state: RootState) => state.gameplay.trackInfo;
export const selectRoundResult = (state: RootState) => state.gameplay.roundResult;
export const selectInitialAnswer = (state: RootState) => state.gameplay.initialAnswer;
export const selectRooms = (state: RootState) => state.gameplay.rooms;