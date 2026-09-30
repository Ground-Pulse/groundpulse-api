import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader =
        client.handshake.auth?.token ||
        client.handshake.headers['authorization'];

      if (!authHeader) {
        this.logger.warn(`Client ${client.id} disconnected: No auth token provided`);
        client.disconnect();
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        process.env.JWT_SECRET ||
        'groundpulse_super_secret_jwt_key_development_2026';

      const payload = await this.jwtService.verifyAsync(token, { secret });
      const userId = payload.sub || payload.id;

      if (!userId) {
        this.logger.warn(`Client ${client.id} disconnected: Invalid token payload`);
        client.disconnect();
        return;
      }

      // Store userId in client data and join personal room
      client.data.userId = userId;
      client.data.user = payload;
      const room = `user:${userId}`;
      await client.join(room);

      this.logger.log(`Client ${client.id} authenticated as User ${userId} and joined room ${room}`);
      client.emit('connected', { status: 'authenticated', userId });
    } catch (error) {
      this.logger.error(`Connection authentication failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id} (User: ${client.data?.userId || 'anonymous'})`);
  }

  /**
   * Helper method to dispatch real-time events to a specific user's room
   */
  sendToUser(userId: string, event: string, payload: any): void {
    const room = `user:${userId}`;
    this.server.to(room).emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Dispatched real-time event '${event}' to room '${room}'`);
  }

  /**
   * Broadcast an event to all connected sockets
   */
  broadcast(event: string, payload: any): void {
    this.server.emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Broadcasted real-time event '${event}' to all clients`);
  }
}
