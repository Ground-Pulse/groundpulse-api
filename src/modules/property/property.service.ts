import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        ownerId,
        address: dto.address,
        type: dto.type,
        coverPhotoUrl: dto.coverPhotoUrl,
        healthScore:
          dto.healthScore !== undefined
            ? new Prisma.Decimal(dto.healthScore)
            : null,
      },
    });
  }

  async findAllByOwner(ownerId: string) {
    return this.prisma.property.findMany({
      where: { ownerId },
      include: {
        inspections: {
          take: 3,
          orderBy: { scheduledDate: 'desc' },
        },
        issues: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, ownerId },
      include: {
        inspections: {
          orderBy: { scheduledDate: 'desc' },
          include: {
            inspector: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
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

    if (!property) {
      throw new NotFoundException(
        `Property with ID '${id}' not found or does not belong to you`,
      );
    }

    return property;
  }

  async update(id: string, ownerId: string, dto: UpdatePropertyDto) {
    await this.findOne(id, ownerId);

    return this.prisma.property.update({
      where: { id },
      data: {
        address: dto.address,
        type: dto.type,
        coverPhotoUrl: dto.coverPhotoUrl,
        healthScore:
          dto.healthScore !== undefined
            ? new Prisma.Decimal(dto.healthScore)
            : undefined,
      },
    });
  }
}
