export interface ValidatedFileResult {
    extension: string;
    mimeType: string;
    storageFilename: string;
}
export declare class FileValidatorUtil {
    private static readonly MAX_FILE_SIZE;
    static validateImageBuffer(buffer: Buffer, originalFilename?: string): ValidatedFileResult;
    static generateRandomFilename(extension: string): string;
    static sanitizeFilename(filename: string): string;
}
