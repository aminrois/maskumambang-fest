"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashUtil = void 0;
const bcrypt = require("bcrypt");
const crypto = require("crypto");
class HashUtil {
    static async hashPassword(password) {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }
    static async verifyPassword(password, hash) {
        if (!hash || !password)
            return false;
        if (hash.startsWith('pbkdf2:')) {
            return this.verifyWerkzeugPbkdf2(password, hash);
        }
        try {
            return await bcrypt.compare(password, hash);
        }
        catch {
            return false;
        }
    }
    static verifyWerkzeugPbkdf2(password, hash) {
        try {
            const parts = hash.split('$');
            if (parts.length !== 3)
                return false;
            const header = parts[0];
            const salt = parts[1];
            const targetHash = parts[2];
            const headerParts = header.split(':');
            if (headerParts.length < 3)
                return false;
            const iterations = parseInt(headerParts[2], 10);
            const digest = headerParts[1] || 'sha256';
            const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, Buffer.from(targetHash, 'hex').length, digest);
            return crypto.timingSafeEqual(derivedKey, Buffer.from(targetHash, 'hex'));
        }
        catch {
            return false;
        }
    }
}
exports.HashUtil = HashUtil;
HashUtil.SALT_ROUNDS = 12;
//# sourceMappingURL=hash.util.js.map