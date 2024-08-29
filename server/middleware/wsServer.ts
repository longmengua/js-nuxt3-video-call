import { WebSocketServer, WebSocket } from 'ws';
import { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  const { req, res } = event.node;

  // Check if it's a WebSocket upgrade request
  if (req.url === '/ws' && req.headers.upgrade?.toLowerCase() === 'websocket') {
    const wss = new WebSocketServer({ noServer: true });

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
      console.log('Client connected');

      ws.on('message', (message: MessageEvent) => {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);

        // Broadcast message to all connected clients
        wss.clients.forEach((client: WebSocket) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });

    // Necessary for the middleware to function correctly
    res.statusCode = 101; // Switching protocols
    res.end();
    return;
  }
});
