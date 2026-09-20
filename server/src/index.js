import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { socketOptions } from './socket/options.js';
import { app } from './app.js';
import { registerSocketHandlers } from './socket/index.js';

const port = Number(process.env.PORT ?? 3001);
const httpServer = createServer(app);
const io = new Server(httpServer, socketOptions());

registerSocketHandlers(io);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`PartyRoom server listening on http://localhost:${port}`);
});
