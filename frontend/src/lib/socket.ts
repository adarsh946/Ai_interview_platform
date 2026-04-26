import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  autoConnect: false, // don't connect automatically
  withCredentials: true,
});

export default socket;
