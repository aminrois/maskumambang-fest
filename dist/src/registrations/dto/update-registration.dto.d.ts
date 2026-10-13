import { Gender, RegistrationStatus } from '@prisma/client';
import { TeamMemberDto } from './create-team.dto';
export declare class UpdateRegistrationDto {
    branchId?: string;
    status?: RegistrationStatus;
    fullName?: string;
    gender?: Gender;
    gradeClass?: string;
    schoolName?: string;
    schoolAddress?: string;
    mentorName?: string;
    whatsappNumber?: string;
    teamName?: string;
    leaderName?: string;
    members?: TeamMemberDto[];
}
