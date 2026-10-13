import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, RegistrationStatus } from '@prisma/client';
import { TeamMemberDto } from './create-team.dto';

export class UpdateRegistrationDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsEnum(RegistrationStatus)
  @IsOptional()
  status?: RegistrationStatus;

  // --- Field Peserta Individu ---
  @IsString()
  @IsOptional()
  @MaxLength(150)
  fullName?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  gradeClass?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  schoolName?: string;

  @IsString()
  @IsOptional()
  schoolAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  mentorName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  whatsappNumber?: string;

  // --- Field Peserta Tim / Beregu ---
  @IsString()
  @IsOptional()
  @MaxLength(150)
  teamName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  leaderName?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  members?: TeamMemberDto[];
}
