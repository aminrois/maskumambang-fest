import { PrismaService } from '../prisma/prisma.service';
export interface PublicParticipantSearchResult {
    registration_number: string;
    participant_name: string;
    school_name: string;
    branch_name: string;
    level_name: string;
    category_name: string;
    status: string;
}
export interface PublicHomepageStatsResult {
    totalParticipants: number;
    individualCount: number;
    teamParticipantCount: number;
    totalTeams: number;
    totalBranches: number;
}
export declare class PublicService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private cachedStats;
    getHomepageStats(): Promise<PublicHomepageStatsResult>;
    searchParticipants(query?: string): Promise<PublicParticipantSearchResult[]>;
}
