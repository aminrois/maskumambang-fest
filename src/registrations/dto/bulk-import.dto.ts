import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, RegistrationStatus } from '@prisma/client';

export class BulkImportSchoolAccountDto {
  @IsEnum(['existing', 'new'])
  mode!: 'existing' | 'new';

  @IsOptional()
  @IsString()
  existingUserId?: string;

  @IsOptional()
  @IsString()
  schoolName?: string;

  @IsOptional()
  @IsString()
  mentorName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class BulkImportItemDto {
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsNotEmpty()
  @IsString()
  branchName!: string;

  @IsOptional()
  @IsString()
  levelName?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsNotEmpty()
  @IsString()
  gradeClass!: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  schoolName?: string;

  @IsOptional()
  @IsString()
  schoolAddress?: string;

  @IsOptional()
  @IsString()
  mentorName?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}

export class BulkImportRegistrationDto {
  @ValidateNested()
  @Type(() => BulkImportSchoolAccountDto)
  schoolAccount!: BulkImportSchoolAccountDto;

  @IsEnum(RegistrationStatus)
  status!: RegistrationStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportItemDto)
  items!: BulkImportItemDto[];
}
