import { ParticipantType } from '@prisma/client';
export declare class CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
}
export declare class UpdateCategoryDto {
    name?: string;
    slug?: string;
    description?: string;
}
export declare class CreateLevelDto {
    categoryId: string;
    name: string;
    slug: string;
}
export declare class UpdateLevelDto {
    name?: string;
    slug?: string;
}
export declare class CreateBranchDto {
    levelId: string;
    name: string;
    participantType: ParticipantType;
    registrationFee: number;
    minTeamMembers?: number;
    maxTeamMembers?: number;
    description?: string;
    juknisUrl?: string;
    maxRegistrants?: number;
}
export declare class UpdateBranchDto {
    name?: string;
    participantType?: ParticipantType;
    registrationFee?: number;
    minTeamMembers?: number;
    maxTeamMembers?: number;
    description?: string;
    juknisUrl?: string;
    maxRegistrants?: number;
}
