import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from '../gateways/notification.gateway';
import { NotificationDispatchProcessor } from './notification-dispatch.processor';
import { ReportGenerationProcessor } from './report-generation.processor';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          process.env.JWT_SECRET ||
          'groundpulse_super_secret_jwt_key_development_2026',
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || process.env.REDIS_URL;
        if (redisUrl) {
          try {
            const parsed = new URL(redisUrl);
            return {
              connection: {
                host: parsed.hostname,
                port: Number(parsed.port) || 6379,
                username: parsed.username || undefined,
                password: parsed.password || undefined,
              },
            };
          } catch {
            // fallback
          }
        }
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST') || process.env.REDIS_HOST || 'localhost',
            port: Number(configService.get<string>('REDIS_PORT')) || Number(process.env.REDIS_PORT) || 6379,
            password: configService.get<string>('REDIS_PASSWORD') || process.env.REDIS_PASSWORD || undefined,
          },
        };
      },
    }),
    BullModule.registerQueue(
      {
        name: 'report-generation',
      },
      {
        name: 'notifications',
      },
    ),
  ],
  providers: [
    NotificationGateway,
    ReportGenerationProcessor,
    NotificationDispatchProcessor,
  ],
  exports: [
    BullModule,
    NotificationGateway,
    ReportGenerationProcessor,
    NotificationDispatchProcessor,
  ],
})
export class QueuesModule {}
