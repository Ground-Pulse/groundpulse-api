import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../gateways/notification.gateway';

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
  channels?: ('in_app' | 'push' | 'email')[];
}

@Processor('notifications')
export class NotificationDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationDispatchProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<{ success: boolean; notificationId: string }> {
    const { userId, title, message, payload } = job.data;
    this.logger.log(`Dispatching notification job for user ${userId}: "${title}"`);

    // 1. Persistent Storage in PostgreSQL
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        payload: payload || {},
        read: false,
      },
    });

    // 2. Real-time WebSocket emission to user room
    this.notificationGateway.sendToUser(userId, 'notification:new', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      payload: notification.payload,
      createdAt: notification.createdAt,
    });

    this.logger.log(`Notification ${notification.id} stored and emitted to user:${userId}`);

    return {
      success: true,
      notificationId: notification.id,
    };
  }
}
