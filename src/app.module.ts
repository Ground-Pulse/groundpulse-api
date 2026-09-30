import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueuesModule } from './jobs/queues.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CaslModule } from './modules/casl/casl.module';
import { InspectionModule } from './modules/inspection/inspection.module';
import { IssueRepairModule } from './modules/issue-repair/issue-repair.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PropertyModule } from './modules/property/property.module';
import { ProviderModule } from './modules/provider/provider.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CaslModule,
    QueuesModule,
    AuthModule,
    PropertyModule,
    InspectionModule,
    IssueRepairModule,
    ProviderModule,
    NotificationModule,
    AdminModule,
  ],
})
export class AppModule {}
