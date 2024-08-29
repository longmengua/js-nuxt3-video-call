import { WebSocketServer, WebSocket } from 'ws';
import { H3Event } from 'h3';

const wss = new WebSocketServer({ noServer: true });
const rooms: { [key: string]: Set<WebSocket> } = {};

export default defineEventHandler(async (event: H3Event) => {
  const { req, res } = event.node;

  if (req.url === '/ws' && req.headers.upgrade?.toLowerCase() === 'websocket') {
    // Handle the upgrade request
    (req.socket as any).server.on('upgrade', (request: any, socket: any, head: Buffer) => {
      if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy(); // Reject requests that are not for /ws
      }
    });

    // WebSocket server logic
    wss.on('connection', (ws: WebSocket) => {
      // console.log('User Connected:');

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          const { type, room, offer, answer, candidate } = data;

          if (type === 'join') {
            if (!rooms[room]) rooms[room] = new Set();
            if (rooms[room].size >= 2) {
              ws.send(JSON.stringify({ type: 'full' }));
              return;
            }
            rooms[room].add(ws);
            if (rooms[room].size === 2) {
              rooms[room].forEach(client => client.send(JSON.stringify({ type: 'ready' })));
            } else {
              ws.send(JSON.stringify({ type: 'created' }));
            }
          } else if (type === 'ready') {
            const peers = Array.from(rooms[room] || []).filter(client => client !== ws);
            peers.forEach(peer => peer.send(JSON.stringify({ type: 'ready' })));
          } else if (type === 'offer' || type === 'answer' || type === 'candidate') {
            const peers = Array.from(rooms[room] || []).filter(client => client !== ws);
            peers.forEach(peer => peer.send(JSON.stringify({ type, [type]: type === 'candidate' ? candidate : (type === 'offer' ? offer : answer) })));
          }
        } catch (err) {
          console.error('Error processing message:', err);
        }
      });

      ws.on('close', () => {
        for (const room in rooms) {
          rooms[room].delete(ws);
          if (rooms[room].size === 0) delete rooms[room];
        }
        // console.log('User Disconnected:');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Necessary for the middleware to function correctly
    res.statusCode = 101; // Switching protocols
    res.end();
    return;
  }
});
