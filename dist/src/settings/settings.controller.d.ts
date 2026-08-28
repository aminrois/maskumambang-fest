import { SettingsService } from './settings.service';
import { UpdateSettingsDto, ResetOperationalDataDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<{
        success: boolean;
        data: Record<string, string>;
    }>;
    updateSettings(staffId: string, dto: UpdateSettingsDto): Promise<{
        success: boolean;
        message: string;
        data: Record<string, string>;
    }>;
    uploadLogo(staffId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
            filename: string;
            url: string;
        };
    }>;
    uploadFavicon(staffId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
            filename: string;
            url: string;
        };
    }>;
    resetOperationalData(staffId: string, dto: ResetOperationalDataDto): Promise<{
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
        };
    }>;
}
