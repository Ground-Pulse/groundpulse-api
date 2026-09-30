import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { IssueRepairController } from './issue-repair.controller';
import { IssueRepairService } from './issue-repair.service';

@Module({
  imports: [NotificationModule],
  controllers: [IssueRepairController],
  providers: [IssueRepairService],
  exports: [IssueRepairService],
})
export class IssueRepairModule {}
