import { useState } from "react";
import { useGameRoom } from "../../hooks/useGameRoom";

const GameLobby = () => {
    const { roomInfo, rooms, createRoom, joinRoom, leaveRoom } = useGameRoom();
    const [roomIdInput, setRoomIdInput] = useState("");

    const copyInviteLink = () => {
        if (roomInfo) {
            const inviteLink = `${window.location.origin}/game?room=${roomInfo.roomId}`;
            navigator.clipboard.writeText(inviteLink)
                .then(() => alert("Посилання скопійовано!"))
                .catch((err) => console.error("Помилка копіювання:", err));
        }
    };

    return (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>Game Room</h2>
            {!roomInfo ? (
                <>
                    <button onClick={createRoom} style={buttonStyle}>Створити кімнату</button>
                    <br /><br />
                    <input
                        type="text"
                        placeholder="Введіть ID кімнати"
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        style={inputStyle}
                    />
                    <button onClick={() => joinRoom(roomIdInput)} style={buttonStyle}>Доєднатися</button>

                    <h3>Доступні кімнати:</h3>
                    <ul>
                        {rooms.map((room) => (
                            <li key={room.id}>
                                Кімната {room.id} ({room.players.length}/{room.maxPlayers} гравців)
                                <button onClick={() => joinRoom(room.id)} style={buttonStyle}>Приєднатися</button>
                            </li>
                        ))}
                    </ul>

                </>
            ) : (
                <>
                    <h3>Кімната: {roomInfo.roomId}</h3>
                    <h4>Гравці:</h4>
                    <ul>
                        {roomInfo.players.map((player) => (
                            <li key={player.id}>{player.login} (ID: {player.id})</li>
                        ))}
                    </ul>
                    <button onClick={copyInviteLink} style={buttonStyle}>Запросити друзів</button>
                    <button onClick={leaveRoom} style={{ ...buttonStyle, background: "red" }}>Вийти</button>
                </>
            )}
        </div>
    );
};

const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    margin: "5px",
    cursor: "pointer",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
};

const inputStyle = {
    padding: "10px",
    fontSize: "16px",
    margin: "5px",
};

export default GameLobby;
