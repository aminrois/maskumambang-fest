import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateIndividualRegistrationDto {
  @IsString()
  @IsNotEmpty({ message: 'ID Cabang lomba wajib diisi.' })
  branchId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap peserta wajib diisi.' })
  @MaxLength(150, { message: 'Nama maksimal 150 karakter.' })
  fullName!: string;

  @IsEnum(Gender, { message: 'Jenis kelamin harus L (Laki-laki) atau P (Perempuan).' })
  gender!: Gender;

  @IsString()
  @IsNotEmpty({ message: 'Kelas / Tingkat wajib diisi.' })
  @MaxLength(50)
  gradeClass!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama asal sekolah wajib diisi.' })
  @MaxLength(200)
  schoolName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Alamat sekolah wajib diisi.' })
  schoolAddress!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama guru pembimbing wajib diisi.' })
  @MaxLength(150)
  mentorName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nomor WhatsApp wajib diisi.' })
  @MaxLength(30)
  whatsappNumber!: string;
}
