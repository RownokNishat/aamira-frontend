import { io } from "socket.io-client";

const URL = import.meta.env.VITE_APP_API_URL || "http://localhost:3001";

console.log("Connecting to socket at:", URL);
export const socket = io(URL, {
  transports: ["websocket"],
});
