export declare class HashUtil {
    private static readonly SALT_ROUNDS;
    static hashPassword(password: string): Promise<string>;
    static verifyPassword(password: string, hash: string): Promise<boolean>;
    private static verifyWerkzeugPbkdf2;
}
