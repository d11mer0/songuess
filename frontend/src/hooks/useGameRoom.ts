import { useState, useEffect } from "react";
import { socketService } from "../services/socketService";
import { useSearchParams, useNavigate } from "react-router-dom";

interface Player {
    id: string;
    login: string;
}

interface RoomInfo {
    roomId: string;
    players: Player[];
}

interface Room {
    id: string;
    maxPlayers: number;
    players: Player[];
}

export const useGameRoom = () => {
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        socketService.connect();
        socketService.emit("getRooms"); // Запитуємо список кімнат

        const savedRoom = localStorage.getItem("roomInfo");
        const roomIdFromUrl = searchParams.get("room");

        if (roomIdFromUrl) {
            socketService.emit("joinRoom", { roomId: roomIdFromUrl });
        } else if (savedRoom) {
            const parsedRoom: RoomInfo = JSON.parse(savedRoom);
            socketService.emit("reconnectRoom", { roomId: parsedRoom.roomId });

            const handleReconnected = (data: { roomId: string; players: Player[] }) => {
                setRoomInfo(data);
                localStorage.setItem("roomInfo", JSON.stringify(data));
                if (searchParams.get("room") !== data.roomId) {
                    navigate(`/game?room=${data.roomId}`, { replace: true });
                }
            };
            socketService.on("joinedRoom", handleReconnected);
        }

        const handleRoomCreated = (data: { roomId: string; players: Player[] }) => {
            setRoomInfo(data);
            localStorage.setItem("roomInfo", JSON.stringify(data));
            navigate(`/game?room=${data.roomId}`, { replace: true });
        };

        const handleJoinedRoom = (data: { roomId: string; players: Player[] }) => {
            setRoomInfo(data);
            localStorage.setItem("roomInfo", JSON.stringify(data));
            navigate(`/game?room=${data.roomId}`, { replace: true });
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
        

        socketService.on("roomCreated", handleRoomCreated);
        socketService.on("joinedRoom", handleJoinedRoom);
        socketService.on("playerJoined", handlePlayerJoined);
        socketService.on("playerLeft", handlePlayerLeft);
        socketService.on("roomsList", handleRoomsUpdate);

        return () => {
            socketService.off("roomsList",);
            socketService.off("roomCreated");
            socketService.off("joinedRoom");
            socketService.off("playerJoined");
            socketService.off("playerLeft");
        };
    }, []);

    const createRoom = () => socketService.emit("createRoom");
    const joinRoom = (roomId: string) => socketService.emit("joinRoom", { roomId });
    const leaveRoom = () => {
        if (roomInfo) {
            socketService.emit("leaveRoom", { roomId: roomInfo.roomId });
            localStorage.removeItem("roomInfo");
            setRoomInfo(null);
            navigate("/game", { replace: true });
        }
    };

    return { roomInfo, rooms, createRoom, joinRoom, leaveRoom };
};