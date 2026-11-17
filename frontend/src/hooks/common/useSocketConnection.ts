import { useEffect } from "react";
import { socketInstance } from "../../services/socket";

export const useSocketConnection = () => {
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            socketInstance.connect();
        }
    }, []);
};
