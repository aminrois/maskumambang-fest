import { Gender } from '@prisma/client';
export declare class TeamMemberDto {
    memberName: string;
    gender: Gender;
    gradeClass: string;
    positionRole?: string;
}
export declare class CreateTeamRegistrationDto {
    branchId: string;
    teamName: string;
    schoolName: string;
    schoolAddress: string;
    mentorName: string;
    whatsappNumber: string;
    leaderName: string;
    members: TeamMemberDto[];
}
