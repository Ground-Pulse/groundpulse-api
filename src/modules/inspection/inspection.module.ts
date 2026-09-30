import { Module } from '@nestjs/common';
import { QueuesModule } from '../../jobs/queues.module';
import { NotificationModule } from '../notification/notification.module';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';

@Module({
  imports: [NotificationModule, QueuesModule],
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService],
})
export class InspectionModule {}
