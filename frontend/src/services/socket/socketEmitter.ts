import { socketInstance } from "./socketInstance";

class SocketEmitter {
    emit(event: string, data?: any) {
        const socket = socketInstance.getSocket();
        if (socket) {
            console.log(`📤 Відправка події ${event} з даними:`, data);
            socket.emit(event, data);
        }
    }
}

export const socketEmitter = new SocketEmitter();