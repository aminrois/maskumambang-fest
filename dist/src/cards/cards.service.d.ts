import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export declare class CardsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getParticipantCard(registrationId: string, requesterUserId: string, requesterRole: Role): Promise<{
        registration_number: string;
        participant_name: string;
        school_name: string;
        category_name: string;
        level_name: string;
        branch_name: string;
        participant_type: import(".prisma/client").$Enums.ParticipantType;
        mentor_name: string;
        leader_name: string | null;
        members: {
            id: string;
            createdAt: Date;
            gender: import(".prisma/client").$Enums.Gender;
            gradeClass: string;
            teamId: string;
            memberName: string;
            positionRole: string | null;
        }[];
        qr_data_uri: string;
        qr_code_token: string;
        status: "APPROVED";
        app_title: string;
        app_short_name: string;
        logo_url: string;
    }>;
}
