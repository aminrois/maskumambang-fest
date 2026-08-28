"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidatorUtil = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const path = require("path");
class FileValidatorUtil {
    static validateImageBuffer(buffer, originalFilename) {
        if (!buffer || buffer.length === 0) {
            throw new common_1.BadRequestException('File bukti pembayaran tidak boleh kosong.');
        }
        if (buffer.length > this.MAX_FILE_SIZE) {
            throw new common_1.BadRequestException('Ukuran file melebihi batas maksimum 5MB.');
        }
        if (buffer.length >= 8 &&
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0d &&
            buffer[5] === 0x0a &&
            buffer[6] === 0x1a &&
            buffer[7] === 0x0a) {
            return {
                extension: 'png',
                mimeType: 'image/png',
                storageFilename: this.generateRandomFilename('png'),
            };
        }
        if (buffer.length >= 3 &&
            buffer[0] === 0xff &&
            buffer[1] === 0xd8 &&
            buffer[2] === 0xff) {
            return {
                extension: 'jpg',
                mimeType: 'image/jpeg',
                storageFilename: this.generateRandomFilename('jpg'),
            };
        }
        if (buffer.length >= 12 &&
            buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WEBP') {
            return {
                extension: 'webp',
                mimeType: 'image/webp',
                storageFilename: this.generateRandomFilename('webp'),
            };
        }
        throw new common_1.BadRequestException('Format file tidak valid atau rusak. Hanya format PNG, JPG, dan WEBP asli yang diizinkan.');
    }
    static generateRandomFilename(extension) {
        const randomHex = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        return `proof_${randomHex}_${timestamp}.${extension}`;
    }
    static sanitizeFilename(filename) {
        return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '');
    }
}
exports.FileValidatorUtil = FileValidatorUtil;
FileValidatorUtil.MAX_FILE_SIZE = 5 * 1024 * 1024;
//# sourceMappingURL=file-validator.util.js.map