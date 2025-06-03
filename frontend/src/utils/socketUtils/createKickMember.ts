import { socketEmitter } from "../../services/socket";

export const createKickMember = (roomId?: string) => {
    return (memberId: number) => {
        if (roomId) {
            socketEmitter.emit('kickMember', { roomId, memberId });
        }
    };
};