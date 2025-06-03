import { socketInstance } from './socketInstance';

type Callback = (data: any) => void;

class SocketHandlers {
    private listeners = new Map<string, Callback>();

    on(event: string, callback: Callback) {
        const socket = socketInstance.getSocket();
        if (!socket) return;

        if (this.listeners.has(event)) {
            socket.off(event, this.listeners.get(event)!);
        }

        socket.on(event, callback);
        this.listeners.set(event, callback);
    }

    off(event: string) {
        const socket = socketInstance.getSocket();
        if (!socket) return;

        if (this.listeners.has(event)) {
            socket.off(event, this.listeners.get(event)!);
            this.listeners.delete(event);
        }
    }
}

export const socketHandlers = new SocketHandlers();
