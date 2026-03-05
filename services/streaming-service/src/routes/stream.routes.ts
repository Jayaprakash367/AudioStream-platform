import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StreamingService } from '../services';
import { streamRequestSchema } from '@auralux/common';

export async function registerStreamRoutes(app: FastifyInstance, streamService: StreamingService): Promise<void> {
  /** POST /stream/start — Generate signed stream URL */
  app.post('/stream/start', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = streamRequestSchema.parse(request.body);
    const session = await streamService.createStreamSession({
      userId: request.headers['x-user-id'] as string,
      songId: body.songId,
      quality: body.quality,
      subscription: (request.headers['x-user-subscription'] as string) || 'FREE',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || 'unknown',
    });
    reply.send({ success: true, data: session });
  });

  /** POST /stream/validate — Validate playback token */
  app.post('/stream/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.body as { token: string };
    const result = await streamService.validatePlaybackToken(token);
    reply.send({ success: true, data: result });
  });

  /** GET /stream/sessions — Get user's active sessions */
  app.get('/stream/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const sessions = await streamService.getActiveSessions(userId);
    reply.send({ success: true, data: sessions });
  });

  /** POST /stream/end — End a streaming session */
  app.post('/stream/end', async (request: FastifyRequest, reply: FastifyReply) => {
    const { sessionId } = request.body as { sessionId: string };
    const userId = request.headers['x-user-id'] as string;
    await streamService.endSession(sessionId, userId);
    reply.send({ success: true, data: { message: 'Session ended' } });
  });
}
