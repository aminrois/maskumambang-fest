import { PrismaService } from '../prisma/prisma.service';
export interface AuditLogDto {
    userId?: string;
    action: string;
    targetTable: string;
    targetId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(dto: AuditLogDto): Promise<void>;
    listLogs(search?: string, action?: string, page?: number, perPage?: number): Promise<{
        logs: ({
            user: {
                id: string;
                email: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            userId: string | null;
            action: string;
            targetTable: string;
            targetId: string | null;
            details: string | null;
            ipAddress: string | null;
            userAgent: string | null;
        })[];
        pagination: {
            total: number;
            page: number;
            perPage: number;
            totalPages: number;
        };
    }>;
}
