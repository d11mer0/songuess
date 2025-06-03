import { useEffect } from "react";
import { socketEmitter, socketInstance } from "../../services/socket";

export const useSocketConnection = () => {
    useEffect(() => {
        socketInstance.connect();
        socketEmitter.emit('reconnectRoom');
    }, []);
};
