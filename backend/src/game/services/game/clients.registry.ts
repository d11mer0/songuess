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
        return [...this.clients.entries()].find(([_, id]) => id === userId)?.[0];
    }

    getAll() {
        return this.clients;
    }
}