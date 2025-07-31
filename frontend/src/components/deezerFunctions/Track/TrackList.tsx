import React from 'react';
import TrackListFull from './TrackList/TrackListFull';
import TrackPreviewSummary from './TrackList/TrackPreviewSummary';


export interface Track {
    id: number;
    title: string;
    preview: string;
    artistName?: string; // Для плейлістів
    albumName?: string; // Для артистів
}

interface TrackListProps {
    title: string;
    tracks: Track[];
    isLoading: boolean;
    error?: unknown;
    isList: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
    title,
    tracks,
    isLoading,
    error,
    isList,
}) => {
    if (isLoading) return <></>;

    return isList ? (
        <TrackListFull title={title} tracks={tracks} />
    ) : (
        <TrackPreviewSummary tracks={tracks} />
    );
};

export default TrackList;