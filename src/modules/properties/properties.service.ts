import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        ownerId,
        address: dto.address,
        type: dto.type,
        coverPhotoUrl: dto.coverPhotoUrl,
        healthScore: dto.healthScore !== undefined ? dto.healthScore : null,
      },
    });
  }

  async findAllByOwner(ownerId: string) {
    return this.prisma.property.findMany({
      where: { ownerId },
      include: {
        inspections: {
          take: 3,
          orderBy: {
            scheduledDate: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, ownerId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        ownerId,
      },
      include: {
        inspections: {
          orderBy: {
            scheduledDate: 'desc',
          },
          include: {
            inspector: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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
}
