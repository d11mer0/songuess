import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL_DEV || '/';

class SocketInstance {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket || this.socket.disconnected) {
            const token = localStorage.getItem('accessToken');

            this.socket = io(API_URL, {
                transports: ['websocket'],
                auth: { token },
                reconnection: true,
                autoConnect: false,
            });

            this.socket.on('connect', () => {
                console.log('✅ WebSocket підключено:', this.socket?.id);
            });

            this.socket.on('disconnect', (reason) => {
                console.log(`❌ WebSocket відключено (${reason})`);
            });

            this.socket.on('reconnect_attempt', () => {
                console.log('🔄 Спроба перепідключення...');
            });

            this.socket.on('reconnect', () => {
                console.log('✅ WebSocket успішно перепідключено');
            });
        }

        if (this.socket && !this.socket.connected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket && this.socket.connected) {
            this.socket.disconnect();
            console.log('🔌 WebSocket вручну відключено');
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return this.socket ? this.socket.connected : false;
    }
}

export const socketInstance = new SocketInstance();
