import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateInspectionDto {
  @IsUUID('4', { message: 'Property ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Property ID is required' })
  propertyId: string;

  @IsDateString({}, { message: 'Scheduled date must be a valid ISO-8601 date string' })
  @IsNotEmpty({ message: 'Scheduled date is required' })
  scheduledDate: string;

  @IsString({ message: 'Recurrence rule must be a string' })
  @IsOptional()
  recurrenceRule?: string;

  @IsUUID('4', { message: 'Inspector ID must be a valid UUID' })
  @IsOptional()
  inspectorId?: string;
}
