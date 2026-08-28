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
export declare class PublicService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchParticipants(query?: string): Promise<PublicParticipantSearchResult[]>;
}
