import { socketInstance } from "./socketInstance";

type Callback = (data: any) => void;

class SocketHandlers {
    on(event: string, callback: Callback) {
        const socket = socketInstance.getSocket();
        if (socket) {
            socket.on(event, callback);
        }
    }

    off(event: string) {
        const socket = socketInstance.getSocket();
        if (socket) {
            socket.off(event);
        }
    }
}

export const socketHandlers = new SocketHandlers();
