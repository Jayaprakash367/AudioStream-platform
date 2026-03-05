/**
 * Real-Time Service — WebSocket Routes
 */

import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { RealtimeService, CHANNELS } from '../services';

export async function registerRealtimeRoutes(
  app: FastifyInstance,
  realtimeService: RealtimeService
): Promise<void> {

  // ─── WebSocket Connection ──────────────────────────────────────────────────

  app.get('/ws', { websocket: true }, (connection, request) => {
    const clientId = crypto.randomUUID();
    const userId = (request.query as { userId?: string }).userId;
    const language = (request.query as { language?: string }).language || 'all';

    realtimeService.handleConnection(connection.socket, clientId, userId, language);

    connection.socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(clientId, message, realtimeService);
      } catch {
        connection.socket.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    connection.socket.on('pong', () => {
      // Update last ping time is handled internally
    });

    connection.socket.on('close', () => {
      realtimeService.handleDisconnect(clientId);
    });

    connection.socket.on('error', () => {
      realtimeService.handleDisconnect(clientId);
    });
  });

  // ─── REST API for Stats ────────────────────────────────────────────────────

  app.get('/realtime/stats', async () => {
    return { success: true, data: realtimeService.getStats() };
  });

  app.get('/realtime/recent-songs', async (request) => {
    const { limit } = request.query as { limit?: string };
    const songs = await realtimeService.getRecentSongs(limit ? parseInt(limit, 10) : 20);
    return { success: true, data: songs };
  });

  app.get('/realtime/languages', async () => {
    const languages = await realtimeService.getAvailableLanguages();
    return { success: true, data: languages };
  });
}

// ─── Handle Client Messages ──────────────────────────────────────────────────

function handleClientMessage(
  clientId: string,
  message: { type: string; payload?: Record<string, unknown> },
  realtimeService: RealtimeService
): void {
  switch (message.type) {
    case 'SUBSCRIBE':
      if (message.payload?.channel) {
        realtimeService.subscribe(clientId, message.payload.channel as string);
      }
      break;

    case 'UNSUBSCRIBE':
      if (message.payload?.channel) {
        realtimeService.unsubscribe(clientId, message.payload.channel as string);
      }
      break;

    case 'UPDATE_PREFERENCES':
      realtimeService.updateClientPreferences(
        clientId,
        message.payload?.language as string,
        message.payload?.quality as string
      );
      break;

    case 'PING':
      // Keep-alive, handled by WebSocket pong
      break;
  }
}
