import { createContext, useContext } from 'react';

interface TrackSelectionModeContextValue {
    isMixMode: boolean;
}

export const TrackSelectionModeContext = createContext<TrackSelectionModeContextValue>({
    isMixMode: false,
});

export const useTrackSelectionMode = () => useContext(TrackSelectionModeContext);
