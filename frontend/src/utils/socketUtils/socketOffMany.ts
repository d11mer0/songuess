import { socketHandlers } from "../../services/socket";

export const socketOffMany = (events: string[]) => {
    events.forEach(event => socketHandlers.off(event));
};
