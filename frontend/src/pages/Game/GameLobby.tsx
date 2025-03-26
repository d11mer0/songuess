import { useState, useCallback } from "react";
import { useGameRoom } from "../../hooks/useGameRoom";
import { Player, Room } from "../../types/roomTypes"; // Імпорт типів

const GameLobby = () => {
    const { roomInfo, rooms, createRoom, joinRoom, leaveRoom } = useGameRoom();
    const [roomIdInput, setRoomIdInput] = useState("");

    const handleJoinRoom = useCallback(() => {
        if (roomIdInput.trim()) {
            joinRoom(roomIdInput);
        }
    }, [roomIdInput, joinRoom]);

    const copyInviteLink = useCallback(() => {
        if (roomInfo) {
            const inviteLink = `${window.location.origin}/game?room=${roomInfo.id}`;
            navigator.clipboard.writeText(inviteLink)
                .then(() => alert("Посилання скопійовано!"))
                .catch((err) => console.error("Помилка копіювання:", err));
        }
    }, [roomInfo]);

    return (
        <div style={styles.container}>
            <h2>Game Room</h2>
            {!roomInfo ? (
                <>
                    <button onClick={createRoom} style={styles.button}>Створити кімнату</button>
                    <br /><br />
                    <input
                        type="text"
                        placeholder="Введіть ID кімнати"
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleJoinRoom} style={styles.button} disabled={!roomIdInput.trim()}>
                        Доєднатися
                    </button>

                    <h3>Доступні кімнати:</h3>
                    {rooms.length > 0 ? (
                        <ul>
                            {rooms.map((room: Room) => (
                                <li key={room.id}>
                                    Кімната {room.id} ({room.players.length}/{room.maxPlayers} гравців)
                                    <button onClick={() => joinRoom(room.id)} style={styles.button}>
                                        Приєднатися
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Немає доступних кімнат</p>
                    )}
                </>
            ) : (
                <>
                    <h3>Кімната: {roomInfo.id}</h3>
                    <h4>Гравці:</h4>
                    <ul>
                        {roomInfo.players.map((player: Player) => (
                            <li key={player.id}>{player.login} (ID: {player.id})</li>
                        ))}
                    </ul>
                    <button onClick={copyInviteLink} style={styles.button}>Запросити друзів</button>
                    <button onClick={leaveRoom} style={styles.exitButton}>Вийти</button>
                </>
            )}
        </div>
    );
};

// Стилі
const styles = {
    container: { padding: "20px", textAlign: "center" as "center" },
    button: {
        padding: "10px 20px",
        fontSize: "16px",
        margin: "5px",
        cursor: "pointer",
        background: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
    },
    exitButton: {
        padding: "10px 20px",
        fontSize: "16px",
        margin: "5px",
        cursor: "pointer",
        background: "red",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
    },
    input: {
        padding: "10px",
        fontSize: "16px",
        margin: "5px",
    },
};

export default GameLobby;