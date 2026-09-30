import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../gateways/notification.gateway';

export interface ReportGenerationJobData {
  inspectionId: string;
  propertyId: string;
  ownerId: string;
  inspectorId?: string;
  generatedBy?: string;
}

@Processor('report-generation')
export class ReportGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {
    super();
  }

  async process(job: Job<ReportGenerationJobData>): Promise<{ reportUrl: string }> {
    const { inspectionId, propertyId, ownerId, inspectorId } = job.data;
    this.logger.log(`Processing inspection PDF report generation for inspection ${inspectionId}...`);

    await job.updateProgress(10);

    // Fetch full inspection with issues and property details
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        property: true,
        issues: true,
        inspector: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!inspection) {
      throw new Error(`Inspection with ID ${inspectionId} not found`);
    }

    await job.updateProgress(50);

    // Simulate S3 PDF report generation & upload
    const timestamp = Date.now();
    const mockS3ReportUrl = `https://groundpulse-reports.s3.amazonaws.com/inspections/${inspectionId}/report-${timestamp}.pdf`;

    // Update inspection record with the reportUrl
    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        reportUrl: mockS3ReportUrl,
      },
    });

    await job.updateProgress(90);

    // Persist notification for the property owner
    const notification = await this.prisma.notification.create({
      data: {
        userId: ownerId,
        title: 'Inspection Report Ready',
        message: `The official inspection report for "${inspection.property.address}" is now ready for review.`,
        payload: {
          inspectionId,
          propertyId,
          reportUrl: mockS3ReportUrl,
        },
      },
    });

    // Real-time notification broadcast to the owner room
    this.notificationGateway.sendToUser(ownerId, 'notification:new', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      payload: notification.payload,
      createdAt: notification.createdAt,
    });

    if (inspectorId) {
      this.notificationGateway.sendToUser(inspectorId, 'inspection:report_generated', {
        inspectionId,
        reportUrl: mockS3ReportUrl,
      });
    }

    await job.updateProgress(100);
    this.logger.log(`Inspection report generated successfully: ${mockS3ReportUrl}`);

    return { reportUrl: mockS3ReportUrl };
  }
}
