import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WSClient {
  ws: WebSocket;
  assignmentId?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = Math.random().toString(36).slice(2, 9);
      this.clients.set(clientId, { ws });

      console.log(`🔌 WS client connected: ${clientId}`);

      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'subscribe' && msg.assignmentId) {
            const client = this.clients.get(clientId);
            if (client) {
              client.assignmentId = msg.assignmentId;
              this.clients.set(clientId, client);
              console.log(`📡 Client ${clientId} subscribed to ${msg.assignmentId}`);
            }
          }
        } catch (err) {
          console.error('WS message parse error:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`🔌 WS client disconnected: ${clientId}`);
      });

      ws.on('error', (err) => {
        console.error(`WS error for client ${clientId}:`, err);
        this.clients.delete(clientId);
      });

      // Send connection confirmation
      ws.send(JSON.stringify({ type: 'connected', clientId }));
    });
  }

  notifyAssignment(assignmentId: string, payload: object) {
    let notified = 0;
    this.clients.forEach((client) => {
      if (
        client.assignmentId === assignmentId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(JSON.stringify({ ...payload, assignmentId }));
        notified++;
      }
    });
    console.log(`📢 Notified ${notified} clients for assignment ${assignmentId}`);
  }

  broadcast(payload: object) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(payload));
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();
