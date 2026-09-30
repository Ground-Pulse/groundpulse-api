import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IssueStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  ApproveIssueDto,
  AssignRepairDto,
  CreateIssueDto,
  UpdateRepairStatusDto,
} from './dto/issue-repair.dto';

@Injectable()
export class IssueRepairService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Log a newly discovered property/inspection issue
   */
  async createIssue(userId: string, userRole: Role, dto: CreateIssueDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { owner: true },
    });

    if (!property) {
      throw new NotFoundException(`Property ${dto.propertyId} not found`);
    }

    // Role verification
    if (userRole === Role.OWNER && property.ownerId !== userId) {
      throw new ForbiddenException('You do not own this property');
    }

    const issue = await this.prisma.issue.create({
      data: {
        propertyId: dto.propertyId,
        inspectionId: dto.inspectionId || null,
        title: dto.title,
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
        status: IssueStatus.REPORTED,
      },
      include: {
        property: true,
      },
    });

    // Notify owner if created by an inspector
    if (userRole === Role.INSPECTOR) {
      await this.notificationService.queueNotification({
        userId: property.ownerId,
        title: 'New Property Issue Reported',
        message: `Inspector logged a ${issue.severity} severity issue: "${issue.title}" on "${property.address}".`,
        payload: { issueId: issue.id, propertyId: property.id },
      });
    }

    return issue;
  }

  /**
   * ACID Transaction: Approve Issue -> Dispatch Repair -> Audit Log -> Queue Notification
   */
  async approveIssueAndDispatchRepair(
    issueId: string,
    approverId: string,
    approverRole: Role,
    dto: ApproveIssueDto,
  ) {
    // 1. Fetch issue with property details
    const existingIssue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        property: true,
      },
    });

    if (!existingIssue) {
      throw new NotFoundException(`Issue with ID '${issueId}' not found`);
    }

    if (
      approverRole === Role.OWNER &&
      existingIssue.property.ownerId !== approverId
    ) {
      throw new ForbiddenException('You do not have permission to approve this issue');
    }

    if (existingIssue.status !== IssueStatus.REPORTED) {
      throw new BadRequestException(
        `Cannot approve issue with status '${existingIssue.status}'. Only 'REPORTED' issues can be approved.`,
      );
    }

    // Execute atomic ACID transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 2. Transition issue status to APPROVED
      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          status: IssueStatus.APPROVED,
        },
      });

      // 3. Create associated Repair record
      const repair = await tx.repair.create({
        data: {
          issueId: issueId,
          providerId: dto.providerId || null,
          cost: dto.estimatedCost ? new Prisma.Decimal(dto.estimatedCost) : null,
          status: dto.providerId ? 'SCHEDULED' : 'PENDING',
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        },
        include: {
          provider: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      // 4. Write an immutable AuditLog entry
      const auditLog = await tx.auditLog.create({
        data: {
          userId: approverId,
          action: 'ISSUE_APPROVED_AND_REPAIR_DISPATCHED',
          entity: 'Issue',
          entityId: issueId,
          details: {
            issueId,
            repairId: repair.id,
            propertyId: existingIssue.propertyId,
            previousStatus: IssueStatus.REPORTED,
            newStatus: IssueStatus.APPROVED,
            providerId: dto.providerId || null,
            notes: dto.notes || null,
          },
        },
      });

      return { updatedIssue, repair, auditLog };
    });

    // 5. Dispatch async background notification via BullMQ
    if (dto.providerId) {
      await this.notificationService.queueNotification({
        userId: dto.providerId,
        title: 'New Repair Job Assigned',
        message: `You have been assigned a repair job for issue "${existingIssue.title}" at "${existingIssue.property.address}".`,
        payload: {
          repairId: result.repair.id,
          issueId,
          propertyId: existingIssue.propertyId,
        },
      });
    }

    return result;
  }

  /**
   * Assign or reassign provider to an existing repair
   */
  async assignProviderToRepair(
    repairId: string,
    userId: string,
    role: Role,
    dto: AssignRepairDto,
  ) {
    const repair = await this.prisma.repair.findUnique({
      where: { id: repairId },
      include: { issue: { include: { property: true } } },
    });

    if (!repair) {
      throw new NotFoundException(`Repair ${repairId} not found`);
    }

    if (role === Role.OWNER && repair.issue.property.ownerId !== userId) {
      throw new ForbiddenException('You do not own this property');
    }

    const updated = await this.prisma.repair.update({
      where: { id: repairId },
      data: {
        providerId: dto.providerId,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : repair.scheduledDate,
        cost: dto.cost !== undefined ? new Prisma.Decimal(dto.cost) : repair.cost,
        status: 'SCHEDULED',
      },
      include: {
        provider: { select: { id: true, name: true, email: true, phone: true } },
        issue: true,
      },
    });

    await this.notificationService.queueNotification({
      userId: dto.providerId,
      title: 'Repair Job Assigned',
      message: `You have been scheduled for repair on "${repair.issue.title}".`,
      payload: { repairId, issueId: repair.issueId },
    });

    return updated;
  }

  /**
   * Update repair status (e.g. In Progress, Completed, Cancelled)
   */
  async updateRepairStatus(
    repairId: string,
    userId: string,
    role: Role,
    dto: UpdateRepairStatusDto,
  ) {
    const repair = await this.prisma.repair.findUnique({
      where: { id: repairId },
      include: { issue: { include: { property: true } } },
    });

    if (!repair) {
      throw new NotFoundException(`Repair ${repairId} not found`);
    }

    if (role === Role.PROVIDER && repair.providerId !== userId) {
      throw new ForbiddenException('You are not assigned to this repair');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRepair = await tx.repair.update({
        where: { id: repairId },
        data: {
          status: dto.status,
          completedAt:
            dto.status === 'COMPLETED'
              ? dto.completedAt
                ? new Date(dto.completedAt)
                : new Date()
              : repair.completedAt,
          cost: dto.cost !== undefined ? new Prisma.Decimal(dto.cost) : repair.cost,
        },
      });

      // If repair completed, resolve the linked issue
      if (dto.status === 'COMPLETED') {
        await tx.issue.update({
          where: { id: repair.issueId },
          data: { status: IssueStatus.RESOLVED },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: `REPAIR_STATUS_${dto.status}`,
          entity: 'Repair',
          entityId: repairId,
          details: {
            previousStatus: repair.status,
            newStatus: dto.status,
          },
        },
      });

      return updatedRepair;
    });
  }

  /**
   * Query issues filtered by user role
   */
  async findIssuesForUser(userId: string, role: Role) {
    if (role === Role.OWNER) {
      return this.prisma.issue.findMany({
        where: { property: { ownerId: userId } },
        include: { property: true, repairs: true, inspection: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === Role.INSPECTOR) {
      return this.prisma.issue.findMany({
        where: {
          inspection: { inspectorId: userId },
        },
        include: { property: true, inspection: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === Role.PROVIDER) {
      return this.prisma.issue.findMany({
        where: {
          repairs: { some: { providerId: userId } },
        },
        include: { property: true, repairs: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    // ADMIN: return all
    return this.prisma.issue.findMany({
      include: { property: true, repairs: true, inspection: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Query repairs filtered by user role
   */
  async findRepairsForUser(userId: string, role: Role) {
    if (role === Role.PROVIDER) {
      return this.prisma.repair.findMany({
        where: { providerId: userId },
        include: { issue: { include: { property: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === Role.OWNER) {
      return this.prisma.repair.findMany({
        where: { issue: { property: { ownerId: userId } } },
        include: {
          issue: { include: { property: true } },
          provider: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.repair.findMany({
      include: {
        issue: { include: { property: true } },
        provider: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
