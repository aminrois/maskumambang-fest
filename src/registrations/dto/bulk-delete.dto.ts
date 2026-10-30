import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class BulkDeleteRegistrationDto {
  @IsArray({ message: 'Daftar ID pendaftaran harus berupa array.' })
  @ArrayMinSize(1, { message: 'Pilih setidaknya satu pendaftaran untuk dihapus.' })
  registrationIds!: string[];

  @IsString({ message: 'PIN konfirmasi wajib berupa teks.' })
  @IsNotEmpty({ message: 'PIN konfirmasi wajib diisi.' })
  pin!: string;
}
