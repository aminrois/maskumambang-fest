import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    listLogs(search?: string, action?: string, page?: string, perPage?: string): Promise<{
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
        success: boolean;
    }>;
}
