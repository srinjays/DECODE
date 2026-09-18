import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3001' : undefined;

const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

socket.on('connect', () => {
  console.log('🔌 Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (err) => {
  console.warn('⚠️ Connection error:', err.message);
});

export default socket;
