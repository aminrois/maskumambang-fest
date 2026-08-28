import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ParticipantType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori wajib diisi.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug kategori wajib diisi.' })
  slug!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateLevelDto {
  @IsString()
  @IsNotEmpty({ message: 'ID Kategori wajib diisi.' })
  categoryId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama jenjang wajib diisi.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug jenjang wajib diisi.' })
  slug!: string;
}

export class UpdateLevelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'ID Jenjang wajib diisi.' })
  levelId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama cabang lomba wajib diisi.' })
  name!: string;

  @IsEnum(ParticipantType, { message: 'Tipe partisipasi harus INDIVIDUAL atau TEAM.' })
  participantType!: ParticipantType;

  @Type(() => Number)
  @IsNumber({}, { message: 'Biaya pendaftaran harus berupa angka.' })
  @Min(0, { message: 'Biaya pendaftaran tidak boleh negatif.' })
  registrationFee!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minTeamMembers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTeamMembers?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ParticipantType)
  @IsOptional()
  participantType?: ParticipantType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  registrationFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minTeamMembers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxTeamMembers?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
