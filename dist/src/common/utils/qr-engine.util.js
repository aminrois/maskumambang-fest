"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrEngineUtil = void 0;
const crypto = require("crypto");
const QRCode = require("qrcode");
class QrEngineUtil {
    static generateToken(regId, regNumber, salt) {
        const uuidShort = regId.replace(/-/g, '').slice(0, 8);
        const regHex = Buffer.from(regNumber).toString('hex');
        const hmac = crypto
            .createHmac('sha256', salt)
            .update(`${regId}:${regNumber}`)
            .digest('hex');
        return `REGQR_${uuidShort}_${regHex}_${hmac}`;
    }
    static verifyToken(token, regId, regNumber, salt) {
        if (!token || !token.startsWith('REGQR_')) {
            return false;
        }
        const parts = token.split('_');
        if (parts.length !== 4) {
            return false;
        }
        const providedHmac = parts[3];
        const expectedHmac = crypto
            .createHmac('sha256', salt)
            .update(`${regId}:${regNumber}`)
            .digest('hex');
        try {
            return crypto.timingSafeEqual(Buffer.from(providedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
        }
        catch {
            return false;
        }
    }
    static async generateQrDataUri(token) {
        return QRCode.toDataURL(token, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 250,
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
        });
    }
}
exports.QrEngineUtil = QrEngineUtil;
//# sourceMappingURL=qr-engine.util.js.map