export declare class QrEngineUtil {
    static generateToken(regId: string, regNumber: string, salt: string): string;
    static verifyToken(token: string, regId: string, regNumber: string, salt: string): boolean;
    static generateQrDataUri(token: string): Promise<string>;
}
