import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { GameRoom } from '../game/interfaces/game.interface';

const ROOM_PREFIX = 'songuess:room:';
const ACTIVE_ROOMS_SET = 'songuess:active_rooms';
const DEFAULT_TTL_SECONDS = 86400; // 24 hours

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis | null = null;
    private isConnected = false;
    private readonly memoryFallback = new Map<string, GameRoom>();

    async onModuleInit() {
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = Number(process.env.REDIS_PORT) || 6379;

        try {
            this.client = new Redis({
                host: redisHost,
                port: redisPort,
                maxRetriesPerRequest: 1,
                retryStrategy: (times) => {
                    if (times > 3) {
                        return null;
                    }
                    return Math.min(times * 200, 1000);
                },
                lazyConnect: true,
                enableOfflineQueue: false,
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                this.logger.log('Connected to Redis at ' + redisHost + ':' + redisPort);
            });

            this.client.on('error', (err) => {
                if (this.isConnected) {
                    this.logger.warn('Redis connection error: ' + err.message + '. Switching to in-memory fallback.');
                }
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (err: any) {
            this.logger.warn('Could not connect to Redis (' + redisHost + ':' + redisPort + '): ' + err?.message + '. Continuing with in-memory fallback.');
            this.isConnected = false;
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            try {
                await this.client.quit();
            } catch {
                // ignore
            }
        }
    }

    get isRedisActive(): boolean {
        return this.isConnected && this.client !== null;
    }

    async saveRoom(room: GameRoom, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
        this.memoryFallback.set(room.id, JSON.parse(JSON.stringify(room)));

        if (!this.isRedisActive || !this.client) {
            return;
        }

        try {
            const data = JSON.stringify(room);
            const key = ROOM_PREFIX + room.id;
            await this.client
                .multi()
                .set(key, data, 'EX', ttlSeconds)
                .sadd(ACTIVE_ROOMS_SET, room.id)
                .exec();
        } catch (err: any) {
            this.logger.warn('Failed to save room ' + room.id + ' in Redis: ' + err?.message);
        }
    }

    async getRoom(roomId: string): Promise<GameRoom | null> {
        if (!this.isRedisActive || !this.client) {
            return this.memoryFallback.get(roomId) || null;
        }

        try {
            const key = ROOM_PREFIX + roomId;
            const data = await this.client.get(key);
            if (!data) {
                return this.memoryFallback.get(roomId) || null;
            }
            return JSON.parse(data) as GameRoom;
        } catch (err: any) {
            this.logger.warn('Failed to get room ' + roomId + ' from Redis: ' + err?.message);
            return this.memoryFallback.get(roomId) || null;
        }
    }

    async deleteRoom(roomId: string): Promise<void> {
        this.memoryFallback.delete(roomId);

        if (!this.isRedisActive || !this.client) {
            return;
        }

        try {
            const key = ROOM_PREFIX + roomId;
            await this.client
                .multi()
                .del(key)
                .srem(ACTIVE_ROOMS_SET, roomId)
                .exec();
        } catch (err: any) {
            this.logger.warn('Failed to delete room ' + roomId + ' from Redis: ' + err?.message);
        }
    }

    async getAllActiveRooms(): Promise<GameRoom[]> {
        if (!this.isRedisActive || !this.client) {
            return Array.from(this.memoryFallback.values());
        }

        try {
            const roomIds = await this.client.smembers(ACTIVE_ROOMS_SET);
            if (!roomIds || roomIds.length === 0) {
                return Array.from(this.memoryFallback.values());
            }

            const rooms: GameRoom[] = [];
            const pipeline = this.client.pipeline();
            for (const id of roomIds) {
                pipeline.get(ROOM_PREFIX + id);
            }

            const results = await pipeline.exec();
            const staleIds: string[] = [];

            if (results) {
                for (let i = 0; i < results.length; i++) {
                    const [err, data] = results[i];
                    const roomId = roomIds[i];

                    if (!err && typeof data === 'string') {
                        try {
                            const parsed = JSON.parse(data) as GameRoom;
                            rooms.push(parsed);
                            this.memoryFallback.set(roomId, parsed);
                        } catch {
                            staleIds.push(roomId);
                        }
                    } else {
                        staleIds.push(roomId);
                    }
                }
            }

            if (staleIds.length > 0) {
                await this.client.srem(ACTIVE_ROOMS_SET, ...staleIds);
            }

            return rooms;
        } catch (err: any) {
            this.logger.warn('Failed to fetch active rooms from Redis: ' + err?.message);
            return Array.from(this.memoryFallback.values());
        }
    }

    private readonly genericCache = new Map<string, { value: string; expiresAt?: number }>();

    async get(key: string): Promise<string | null> {
        const item = this.genericCache.get(key);
        if (item) {
            if (!item.expiresAt || item.expiresAt > Date.now()) {
                return item.value;
            }
            this.genericCache.delete(key);
        }

        if (!this.isRedisActive || !this.client) {
            return null;
        }

        try {
            const val = await this.client.get(key);
            if (val !== null) {
                this.genericCache.set(key, { value: val });
            }
            return val;
        } catch (err: any) {
            this.logger.warn('Failed to get ' + key + ' from Redis: ' + err?.message);
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        this.genericCache.set(key, {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
        });

        if (!this.isRedisActive || !this.client) {
            return;
        }

        try {
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            } else {
                await this.client.set(key, value);
            }
        } catch (err: any) {
            this.logger.warn('Failed to set ' + key + ' in Redis: ' + err?.message);
        }
    }
}
