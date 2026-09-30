import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'Property type is required' })
  type: string;

  @IsUrl({}, { message: 'Cover photo URL must be a valid URL' })
  @IsNotEmpty({ message: 'Cover photo URL is required' })
  coverPhotoUrl: string;

  @IsNumber({}, { message: 'Health score must be a number' })
  @IsOptional()
  healthScore?: number;
}
