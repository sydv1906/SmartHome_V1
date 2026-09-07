import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join_home', (homeId: string) => {
      socket.join(`home_${homeId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined home room: home_${homeId}`);
    });

    socket.on('leave_home', (homeId: string) => {
      socket.leave(`home_${homeId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left home room: home_${homeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};
