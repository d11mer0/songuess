import { io, Socket } from 'socket.io-client';
import { socketHandlers } from './socketHandlers';

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? '/'
        : (import.meta.env.VITE_API_URL_DEV || 'http://localhost:3000'));

class SocketInstance {
    private socket: Socket | null = null;

    connect() {
        const token = localStorage.getItem('accessToken');

        // If the socket was previously created with a different or null token, tear it down
        if (this.socket && (this.socket.auth as { token?: string | null })?.token !== token) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            socketHandlers.bindToSocket(null);
        }

        if (!this.socket || this.socket.disconnected) {
            if (this.socket) {
                this.socket.removeAllListeners();
            }
            this.socket = io(API_URL, {
                transports: ['websocket'],
                auth: { token },
                reconnection: true,
                autoConnect: false,
            });

            this.socket.on('connect', () => {
                console.log('✅ WebSocket підключено:', this.socket?.id);
                this.socket?.emit('reconnectRoom');
            });

            this.socket.on('disconnect', (reason) => {
                console.log(`❌ WebSocket відключено (${reason})`);
            });

            this.socket.on('reconnect_attempt', () => {
                console.log('🔄 Спроба перепідключення...');
            });

            this.socket.on('reconnect', () => {
                console.log('✅ WebSocket успішно перепідключено');
                this.socket?.emit('reconnectRoom');
            });
        }

        if (this.socket) {
            socketHandlers.bindToSocket(this.socket);
        }

        if (this.socket && !this.socket.connected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            if (this.socket.connected) {
                this.socket.disconnect();
                console.log('🔌 WebSocket вручну відключено');
            }
            this.socket = null;
        }
        socketHandlers.bindToSocket(null);
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return this.socket ? this.socket.connected : false;
    }
}

export const socketInstance = new SocketInstance();
