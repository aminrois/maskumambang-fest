import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { ScanCheckInDto } from './dto/checkin.dto';
export declare class CheckInService {
    private readonly prisma;
    private readonly auditService;
    private readonly configService;
    constructor(prisma: PrismaService, auditService: AuditService, configService: ConfigService);
    processCheckIn(staffUserId: string, dto: ScanCheckInDto): Promise<{
        success: boolean;
        message: string;
        data: null;
        already_checked_in: boolean;
        previous_time?: undefined;
        previous_staff?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            registration_number: string;
            participant_name: string;
            school_name: string;
            branch_name: string;
            category_name?: undefined;
            level_name?: undefined;
            participant_type?: undefined;
            check_in_time?: undefined;
            checked_in_by?: undefined;
            method?: undefined;
        };
        already_checked_in: boolean;
        previous_time: string;
        previous_staff: string;
    } | {
        success: boolean;
        message: string;
        data: {
            registration_number: string;
            participant_name: string;
            school_name: string;
            category_name: string;
            level_name: string;
            branch_name: string;
            participant_type: import(".prisma/client").$Enums.ParticipantType;
            check_in_time: string;
            checked_in_by: string;
            method: import(".prisma/client").$Enums.CheckInMethod;
        };
        already_checked_in: boolean;
        previous_time?: undefined;
        previous_staff?: undefined;
    } | {
        success: boolean;
        message: string;
        already_checked_in: boolean;
        data?: undefined;
        previous_time?: undefined;
        previous_staff?: undefined;
    }>;
    processCheckIn2(staffUserId: string, dto: ScanCheckInDto): Promise<{
        success: boolean;
        message: string;
        data: null;
        already_checked_in?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            registration_number: string;
            participant_name: string;
            branch_name: string;
            school_name?: undefined;
            category_name?: undefined;
            level_name?: undefined;
            check_in_2_time?: undefined;
            checked_in_by?: undefined;
            stage?: undefined;
        };
        already_checked_in: boolean;
    } | {
        success: boolean;
        message: string;
        data: {
            registration_number: string;
            participant_name: string;
            school_name: string;
            category_name: string;
            level_name: string;
            branch_name: string;
            check_in_2_time: string;
            checked_in_by: string;
            stage: number;
        };
        already_checked_in: boolean;
    }>;
    getLiveCheckInLogs(limit?: number): Promise<{
        id: string;
        registration_number: string;
        participant_name: string;
        school_name: string;
        branch_name: string;
        check_in_time: string;
        checked_in_by_name: string;
        check_in_method: import(".prisma/client").$Enums.CheckInMethod;
        check_in_2_time: string | null;
        checked_in_2_by_name: string | null;
        check_in_2_method: import(".prisma/client").$Enums.CheckInMethod | null;
    }[]>;
}
