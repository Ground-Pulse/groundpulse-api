import { PrismaClient, Role, InspectionStatus, IssueStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GroundPulse database...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@groundpulse.io' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@groundpulse.io',
      passwordHash,
      role: Role.ADMIN,
      phone: '+1-555-0100',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@groundpulse.io' },
    update: {},
    create: {
      name: 'Elena Rostova (Property Owner)',
      email: 'owner@groundpulse.io',
      passwordHash,
      role: Role.OWNER,
      phone: '+1-555-0101',
    },
  });

  const inspector = await prisma.user.upsert({
    where: { email: 'inspector@groundpulse.io' },
    update: {},
    create: {
      name: 'Marcus Vance (Certified Inspector)',
      email: 'inspector@groundpulse.io',
      passwordHash,
      role: Role.INSPECTOR,
      phone: '+1-555-0102',
    },
  });

  const provider = await prisma.user.upsert({
    where: { email: 'provider@groundpulse.io' },
    update: {},
    create: {
      name: 'Apex Roof & Plumbing Services',
      email: 'provider@groundpulse.io',
      passwordHash,
      role: Role.PROVIDER,
      phone: '+1-555-0103',
    },
  });

  // 2. Create Properties
  const property = await prisma.property.create({
    data: {
      ownerId: owner.id,
      address: '742 Evergreen Terrace, Springfield, OR',
      type: 'Single Family Residence',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
      healthScore: 92.50,
    },
  });

  // 3. Create Inspection
  const inspection = await prisma.inspection.create({
    data: {
      propertyId: property.id,
      inspectorId: inspector.id,
      scheduledDate: new Date(),
      status: InspectionStatus.SCHEDULED,
      recurrenceRule: 'FREQ=MONTHLY;INTERVAL=1',
    },
  });

  // 4. Create Issue
  const issue = await prisma.issue.create({
    data: {
      inspectionId: inspection.id,
      propertyId: property.id,
      title: 'Minor foundation hairline fracture',
      description: 'South-facing corner exterior foundation shows 1mm settling fissure.',
      severity: 'MEDIUM',
      status: IssueStatus.REPORTED,
    },
  });

  console.log('Seed completed successfully:', {
    admin: admin.email,
    owner: owner.email,
    inspector: inspector.email,
    provider: provider.email,
    propertyId: property.id,
    inspectionId: inspection.id,
    issueId: issue.id,
  });
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
