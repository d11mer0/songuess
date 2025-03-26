// /hooks/useGameRoomListeners.ts
import { useEffect } from "react";
import { socketHandlers } from "../services/socket";
import { Room, RoomInfo, Player } from "../types/roomTypes";

interface UseGameRoomListenersProps {
    setRoomInfo: React.Dispatch<React.SetStateAction<RoomInfo | null>>;
    setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
    updateSearchParams: (id: string | null) => void;
}


export const useGameRoomListeners = ({ setRoomInfo, setRooms, updateSearchParams }: UseGameRoomListenersProps) => {
    useEffect(() => {
        const handleRoomCreated = (data: RoomInfo) => {
            setRoomInfo(data);
            localStorage.setItem("roomInfo", JSON.stringify(data));
            updateSearchParams(data.id);
        };

        const handleJoinedRoom = (data: RoomInfo) => {
            if (data) {
                setRoomInfo(data);
                localStorage.setItem("roomInfo", JSON.stringify(data));
                updateSearchParams(data.id);
            } else {
                // Якщо кімната не існує або переповнена, чистимо стан і URL
                setRoomInfo(null);
                localStorage.removeItem("roomInfo");
                updateSearchParams(null);
            }
        };

        const handlePlayerJoined = (data: { player: Player }) => {
            setRoomInfo((prev) =>
                prev ? { ...prev, players: [...prev.players, data.player] } : null
            );
        };

        const handlePlayerLeft = (data: { playerId: string }) => {
            setRoomInfo((prev) =>
                prev ? { ...prev, players: prev.players.filter((p) => p.id !== data.playerId) } : null
            );
        };

        const handleRoomsUpdate = (data: Room[]) => setRooms(data);

        socketHandlers.on("roomCreated", handleRoomCreated);
        socketHandlers.on("joinedRoom", handleJoinedRoom);
        socketHandlers.on("playerJoined", handlePlayerJoined);
        socketHandlers.on("playerLeft", handlePlayerLeft);
        socketHandlers.on("roomsList", handleRoomsUpdate);

        return () => {
            socketHandlers.off("roomCreated");
            socketHandlers.off("joinedRoom");
            socketHandlers.off("playerJoined");
            socketHandlers.off("playerLeft");
            socketHandlers.off("roomsList");
        };
    }, []);
};
