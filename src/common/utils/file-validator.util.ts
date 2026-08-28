import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';

export interface ValidatedFileResult {
  extension: string;
  mimeType: string;
  storageFilename: string;
}

export class FileValidatorUtil {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  /**
   * Validates binary buffer against strict Magic Byte signatures.
   * Allowed formats: PNG, JPEG/JPG, WEBP.
   * Rejects HTML, SVG, executables, scripts, and spoofed files.
   */
  static validateImageBuffer(buffer: Buffer, originalFilename?: string): ValidatedFileResult {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('File bukti pembayaran tidak boleh kosong.');
    }

    if (buffer.length > this.MAX_FILE_SIZE) {
      throw new BadRequestException('Ukuran file melebihi batas maksimum 5MB.');
    }

    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return {
        extension: 'png',
        mimeType: 'image/png',
        storageFilename: this.generateRandomFilename('png'),
      };
    }

    // Check JPEG signature: FF D8 FF
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return {
        extension: 'jpg',
        mimeType: 'image/jpeg',
        storageFilename: this.generateRandomFilename('jpg'),
      };
    }

    // Check WEBP signature: "RIFF" .... "WEBP"
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return {
        extension: 'webp',
        mimeType: 'image/webp',
        storageFilename: this.generateRandomFilename('webp'),
      };
    }

    throw new BadRequestException(
      'Format file tidak valid atau rusak. Hanya format PNG, JPG, dan WEBP asli yang diizinkan.',
    );
  }

  /**
   * Generates cryptographically secure random storage filename.
   * Example: proof_3f2b1a0e_1724716800000.png
   */
  static generateRandomFilename(extension: string): string {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `proof_${randomHex}_${timestamp}.${extension}`;
  }

  /**
   * Sanitizes filename against path traversal attacks.
   */
  static sanitizeFilename(filename: string): string {
    return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '');
  }
}
