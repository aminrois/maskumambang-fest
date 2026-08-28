import { PublicService } from './public.service';
export declare class PublicController {
    private readonly publicService;
    constructor(publicService: PublicService);
    checkParticipants(q?: string): Promise<{
        success: boolean;
        count: number;
        results: import("./public.service").PublicParticipantSearchResult[];
    }>;
}
