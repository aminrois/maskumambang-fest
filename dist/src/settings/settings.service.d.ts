import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { UpdateSettingsDto, ResetOperationalDataDto } from './dto/settings.dto';
export declare class SettingsService {
    private readonly prisma;
    private readonly auditService;
    private readonly configService;
    constructor(prisma: PrismaService, auditService: AuditService, configService: ConfigService);
    getSettings(): Promise<Record<string, string>>;
    updateSettings(staffUserId: string, dto: UpdateSettingsDto): Promise<Record<string, string>>;
    uploadBrandingFile(staffUserId: string, file: Express.Multer.File, type: 'logo' | 'favicon'): Promise<{
        success: boolean;
        filename: string;
        url: string;
    }>;
    resetOperationalData(staffUserId: string, dto: ResetOperationalDataDto): Promise<{
        success: boolean;
        message: string;
        stats: {
            checkIns: number;
            verificationLogs: number;
            payments: number;
            teamMembers: number;
            teams: number;
            individualParticipants: number;
            registrations: number;
            deletedPesertaUsers: number;
        };
    }>;
}
