import { io, Socket } from "socket.io-client";

class SocketService {
    private socket: Socket | null = null;

    connect() {
        const token = localStorage.getItem("accessToken");
        const savedRoom = localStorage.getItem("roomInfo");

        if (!this.socket || this.socket.disconnected) {
            this.socket = io("http://localhost:3000", {
                transports: ["websocket"],
                auth: { token },
                reconnection: true,
                autoConnect: false, // 🔹 Контролюємо підключення вручну
            });

           

            this.socket.on("connect", () => {
                console.log("✅ WebSocket підключено:", this.socket?.id);
            });

            this.socket.on("disconnect", (reason) => {
                console.log(`❌ WebSocket відключено (${reason})`);
            });

            this.socket.on("reconnect_attempt", () => {
                console.log("🔄 Спроба перепідключення...");
            });

            this.socket.on("reconnect", () => {
                console.log("✅ WebSocket успішно перепідключено");
                
                const savedRoom = localStorage.getItem("roomInfo");
                console.log("Я ТУТ!");
                if (savedRoom) {
                    const parsedRoom: { roomId: string } = JSON.parse(savedRoom);
                    this.emit("reconnectRoom", { roomId: parsedRoom.roomId });
                }
            });
        }
        if (this.socket && !this.socket.connected) {
            this.socket.connect();
        }
    }

    emit(event: string, data?: any) {
        if (this.socket) {
            console.log(`📤 Відправка події ${event} з даними:`, data);
            this.socket.emit(event, data);
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export const socketService = new SocketService();