import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateIssueDto {
  @IsUUID('4', { message: 'Property ID must be a valid UUID' })
  @IsNotEmpty()
  propertyId: string;

  @IsUUID('4', { message: 'Inspection ID must be a valid UUID' })
  @IsOptional()
  inspectionId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  severity?: string; // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export class ApproveIssueDto {
  @IsUUID('4', { message: 'Provider ID must be a valid UUID' })
  @IsOptional()
  providerId?: string;

  @IsOptional()
  estimatedCost?: number;

  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AssignRepairDto {
  @IsUUID('4', { message: 'Provider ID must be a valid UUID' })
  @IsNotEmpty()
  providerId: string;

  @IsOptional()
  scheduledDate?: string;

  @IsOptional()
  cost?: number;
}

export class UpdateRepairStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

  @IsOptional()
  completedAt?: string;

  @IsOptional()
  cost?: number;
}
