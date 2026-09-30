import { InjectQueue } from '@nestjs/bullmq';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InspectionStatus, Role } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateInspectionDto,
  UpdateInspectionStatusDto,
} from './dto/inspection.dto';
import { ReportGenerationJobData } from '../../jobs/report-generation.processor';

@Injectable()
export class InspectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    @InjectQueue('report-generation')
    private readonly reportQueue: Queue<ReportGenerationJobData>,
  ) {}

  async create(dto: CreateInspectionDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${dto.propertyId}' not found`);
    }

    const inspection = await this.prisma.inspection.create({
      data: {
        propertyId: dto.propertyId,
        scheduledDate: new Date(dto.scheduledDate),
        recurrenceRule: dto.recurrenceRule || null,
        inspectorId: dto.inspectorId || null,
        status: InspectionStatus.SCHEDULED,
      },
      include: {
        property: true,
        inspector: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    // Notify inspector if assigned
    if (dto.inspectorId) {
      await this.notificationService.queueNotification({
        userId: dto.inspectorId,
        title: 'New Inspection Assigned',
        message: `You have been scheduled for an inspection at ${property.address} on ${new Date(dto.scheduledDate).toLocaleDateString()}.`,
        payload: { inspectionId: inspection.id, propertyId: property.id },
      });
    }

    return inspection;
  }

  async findAllForUser(userId: string, role: Role) {
    if (role === Role.INSPECTOR) {
      return this.prisma.inspection.findMany({
        where: { inspectorId: userId },
        include: { property: true, issues: true },
        orderBy: { scheduledDate: 'asc' },
      });
    }

    if (role === Role.OWNER) {
      return this.prisma.inspection.findMany({
        where: { property: { ownerId: userId } },
        include: {
          property: true,
          inspector: {
            select: { id: true, name: true, email: true, phone: true },
          },
          issues: true,
        },
        orderBy: { scheduledDate: 'desc' },
      });
    }

    // ADMIN: return all
    return this.prisma.inspection.findMany({
      include: {
        property: true,
        inspector: {
          select: { id: true, name: true, email: true, phone: true },
        },
        issues: true,
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        property: true,
        inspector: {
          select: { id: true, name: true, email: true, phone: true },
        },
        issues: {
          include: {
            repairs: {
              include: {
                provider: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection with ID '${id}' not found`);
    }

    return inspection;
  }

  async updateStatus(
    id: string,
    userId: string,
    role: Role,
    dto: UpdateInspectionStatusDto,
  ) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection ${id} not found`);
    }

    if (role === Role.INSPECTOR && inspection.inspectorId !== userId) {
      throw new ForbiddenException('You are not assigned to this inspection');
    }

    const updated = await this.prisma.inspection.update({
      where: { id },
      data: {
        status: dto.status,
        startedAt:
          dto.status === InspectionStatus.IN_PROGRESS && !inspection.startedAt
            ? new Date()
            : inspection.startedAt,
        submittedAt:
          (dto.status === InspectionStatus.SUBMITTED ||
            dto.status === InspectionStatus.COMPLETED) &&
          !inspection.submittedAt
            ? new Date()
            : inspection.submittedAt,
        reportUrl: dto.reportUrl || inspection.reportUrl,
      },
      include: { property: true },
    });

    // Queue BullMQ PDF report generation when inspection is submitted/completed
    if (
      dto.status === InspectionStatus.SUBMITTED ||
      dto.status === InspectionStatus.COMPLETED
    ) {
      await this.reportQueue.add(
        'generate-pdf-report',
        {
          inspectionId: inspection.id,
          propertyId: inspection.propertyId,
          ownerId: inspection.property.ownerId,
          inspectorId: inspection.inspectorId || undefined,
          generatedBy: userId,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
        },
      );
    }

    return updated;
  }
}
