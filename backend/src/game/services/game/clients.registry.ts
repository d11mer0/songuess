import { Socket } from 'socket.io';

export class ClientsRegistry {
    private clients = new Map<string, number>();

    add(client: Socket, userId: number) {
        this.clients.set(client.id, userId);
    }

    remove(client: Socket) {
        this.clients.delete(client.id);
    }

    getUserId(client: Socket): number | undefined {
        return this.clients.get(client.id);
    }

    getClientId(userId: number): string | undefined {
        const matches = [...this.clients.entries()].filter(([_, id]) => id === userId);
        return matches.length > 0 ? matches[matches.length - 1][0] : undefined;
    }

    getAll() {
        return this.clients;
    }
}