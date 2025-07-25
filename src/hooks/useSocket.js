import { useEffect } from "react";
import { socket } from "../services/socket";

export const useSocket = (eventHandlers) => {
  useEffect(() => {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(eventHandlers).forEach((event) => {
        socket.off(event);
      });
    };
  }, [eventHandlers]);
};
