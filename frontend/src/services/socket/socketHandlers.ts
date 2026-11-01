import { socketInstance } from './socketInstance';

type Callback = (data: any) => void;

class SocketHandlers {
    private listeners = new Map<string, Set<Callback>>();
    private attachedEvents = new Set<string>();

    on(event: string, callback: Callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        this.ensureSocketListener(event);
    }

    off(event: string, callback?: Callback) {
        const set = this.listeners.get(event);
        if (!set) return;

        if (callback) {
            set.delete(callback);
            if (set.size === 0) {
                this.listeners.delete(event);
            }
        } else {
            this.listeners.delete(event);
        }
    }

    private ensureSocketListener(event: string) {
        if (this.attachedEvents.has(event)) return;

        const socket = socketInstance.getSocket();
        if (!socket) return;

        this.attachedEvents.add(event);
        socket.on(event, (data: any) => {
            const set = this.listeners.get(event);
            if (set) {
                set.forEach((cb) => {
                    try {
                        cb(data);
                    } catch (err) {
                        console.error(`Error in socket listener for ${event}:`, err);
                    }
                });
            }
        });
    }
}

export const socketHandlers = new SocketHandlers();
