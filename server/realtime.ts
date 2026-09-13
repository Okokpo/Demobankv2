import type { Response } from 'express';

interface ConnectedClient {
  id: string;
  userId: string;
  role: string;
  res: Response;
}

class RealtimeManager {
  private clients: Map<string, ConnectedClient> = new Map();

  constructor() {
    // Send keep-alive heartbeat comments every 20 seconds to keep connections open
    setInterval(() => {
      this.clients.forEach((client) => {
        try {
          client.res.write(': heartbeat\n\n');
        } catch {
          this.removeClient(client.id);
        }
      });
    }, 20000);
  }

  addClient(id: string, userId: string, role: string, res: Response) {
    this.clients.set(id, { id, userId, role, res });
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  notifyUser(userId: string, event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        try {
          client.res.write(payload);
        } catch {
          this.removeClient(client.id);
        }
      }
    });
  }

  notifyAdmins(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => {
      if (client.role === 'admin') {
        try {
          client.res.write(payload);
        } catch {
          this.removeClient(client.id);
        }
      }
    });
  }

  broadcast(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => {
      try {
        client.res.write(payload);
      } catch {
        this.removeClient(client.id);
      }
    });
  }
}

export const realtime = new RealtimeManager();
