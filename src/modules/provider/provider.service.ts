import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllProviders() {
    return this.prisma.user.findMany({
      where: { role: Role.PROVIDER },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        assignedRepairs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            cost: true,
            scheduledDate: true,
            completedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findProviderById(id: string) {
    const provider = await this.prisma.user.findFirst({
      where: { id, role: Role.PROVIDER },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        assignedRepairs: {
          include: {
            issue: {
              include: { property: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID '${id}' not found`);
    }

    return provider;
  }
}
