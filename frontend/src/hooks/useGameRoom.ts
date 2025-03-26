// /hooks/useGameRoom.ts
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { socketInstance, socketEmitter } from "../services/socket";
import { useGameRoomListeners } from "./useGameRoomListeners";
import { Room, RoomInfo } from "../types/roomTypes";

export const useGameRoom = () => {
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const updateSearchParams = (id: string | null) => {
        if (!id) {
            navigate("/game", { replace: true });
        } else if (searchParams.get("room") !== id) {
            navigate(`/game?room=${id}`, { replace: true });
        }
    };

    useEffect(() => {
        socketInstance.connect();
        socketEmitter.emit("getRooms"); // Запитуємо список кімнат

        const savedRoom = localStorage.getItem("roomInfo");
        const roomIdFromUrl = searchParams.get("room");

        if (roomIdFromUrl) {
            const res = socketEmitter.emit("joinRoom", { id: roomIdFromUrl });
            console.log(res);
        } else if (savedRoom) {
            const parsedRoom: RoomInfo = JSON.parse(savedRoom);
            socketEmitter.emit("reconnectRoom", { id: parsedRoom.id });
        }
    }, []);

    useGameRoomListeners({ setRoomInfo, setRooms, updateSearchParams});

    const createRoom = () => socketEmitter.emit("createRoom");
    const joinRoom = (id: string) => socketEmitter.emit("joinRoom", { id });
    const leaveRoom = () => {
        if (roomInfo) {
            socketEmitter.emit("leaveRoom", { id: roomInfo.id });
            localStorage.removeItem("roomInfo");
            setRoomInfo(null);
            updateSearchParams(null);
        }
    };

    return { roomInfo, rooms, createRoom, joinRoom, leaveRoom };
};
