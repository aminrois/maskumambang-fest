declare const _default: () => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    qr: {
        salt: string;
    };
    reset: {
        code: string;
    };
    upload: {
        folder: string;
        maxSizeBytes: number;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
};
export default _default;
