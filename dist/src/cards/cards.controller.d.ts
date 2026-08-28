import { CardsService } from './cards.service';
import { Role } from '@prisma/client';
export declare class CardsController {
    private readonly cardsService;
    constructor(cardsService: CardsService);
    getCard(registrationId: string, userId: string, role: Role): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
