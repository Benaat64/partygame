import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { registerSocketHandlers } from './socket/index.js';

const port = Number(process.env.PORT ?? 3001);
const httpServer = createServer(app);
const io = new Server(httpServer);

registerSocketHandlers(io);

httpServer.listen(port, () => {
  console.log(`PartyRoom server listening on http://localhost:${port}`);
});
