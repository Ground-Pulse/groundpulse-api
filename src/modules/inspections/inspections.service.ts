import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInspectionDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(
        `Property with ID '${dto.propertyId}' does not exist`,
      );
    }

    return this.prisma.inspection.create({
      data: {
        propertyId: dto.propertyId,
        scheduledDate: new Date(dto.scheduledDate),
        recurrenceRule: dto.recurrenceRule || null,
        inspectorId: dto.inspectorId || null,
      },
      include: {
        property: true,
        inspector: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAllForUser(userId: string, role: Role) {
    if (role === Role.INSPECTOR) {
      return this.prisma.inspection.findMany({
        where: {
          inspectorId: userId,
        },
        include: {
          property: true,
        },
        orderBy: {
          scheduledDate: 'asc',
        },
      });
    }

    if (role === Role.OWNER) {
      return this.prisma.inspection.findMany({
        where: {
          property: {
            ownerId: userId,
          },
        },
        include: {
          property: true,
          inspector: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'desc',
        },
      });
    }

    // ADMIN and other roles: return all inspections
    return this.prisma.inspection.findMany({
      include: {
        property: true,
        inspector: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        property: true,
        inspector: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection with ID '${id}' not found`);
    }

    return inspection;
  }
}
