import { CompetitionsService } from './competitions.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateLevelDto, UpdateLevelDto, CreateBranchDto, UpdateBranchDto } from './dto/competition.dto';
export declare class CompetitionsController {
    private readonly competitionsService;
    constructor(competitionsService: CompetitionsService);
    getCompetitionTree(): Promise<{
        success: boolean;
        data: {
            levels: {
                branches: {
                    verifiedCount: number;
                    registrations: undefined;
                    _count: {
                        registrations: number;
                    };
                    id: string;
                    name: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    levelId: string;
                    participantType: import(".prisma/client").$Enums.ParticipantType;
                    registrationFee: import("@prisma/client/runtime/library").Decimal;
                    minTeamMembers: number | null;
                    maxTeamMembers: number | null;
                    juknisUrl: string | null;
                    maxRegistrants: number | null;
                }[];
                id: string;
                name: string;
                createdAt: Date;
                slug: string;
                categoryId: string;
            }[];
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            slug: string;
            description: string | null;
        }[];
    }>;
    getBranchDetail(id: string): Promise<{
        success: boolean;
        data: {
            level: {
                category: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    createdAt: Date;
                    slug: string;
                    description: string | null;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                slug: string;
                categoryId: string;
            };
        } & {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            levelId: string;
            participantType: import(".prisma/client").$Enums.ParticipantType;
            registrationFee: import("@prisma/client/runtime/library").Decimal;
            minTeamMembers: number | null;
            maxTeamMembers: number | null;
            juknisUrl: string | null;
            maxRegistrants: number | null;
        };
    }>;
    getAllCategories(): Promise<{
        success: boolean;
        data: ({
            _count: {
                levels: number;
            };
        } & {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            slug: string;
            description: string | null;
        })[];
    }>;
    createCategory(dto: CreateCategoryDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            slug: string;
            description: string | null;
        };
    }>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            slug: string;
            description: string | null;
        };
    }>;
    toggleCategory(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            slug: string;
            description: string | null;
        };
    }>;
    getLevelsByCategory(categoryId: string): Promise<{
        success: boolean;
        data: ({
            _count: {
                branches: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            slug: string;
            categoryId: string;
        })[];
    }>;
    createLevel(dto: CreateLevelDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            slug: string;
            categoryId: string;
        };
    }>;
    updateLevel(id: string, dto: UpdateLevelDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            slug: string;
            categoryId: string;
        };
    }>;
    getBranchesByLevel(levelId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            levelId: string;
            participantType: import(".prisma/client").$Enums.ParticipantType;
            registrationFee: import("@prisma/client/runtime/library").Decimal;
            minTeamMembers: number | null;
            maxTeamMembers: number | null;
            juknisUrl: string | null;
            maxRegistrants: number | null;
        }[];
    }>;
    createBranch(dto: CreateBranchDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            levelId: string;
            participantType: import(".prisma/client").$Enums.ParticipantType;
            registrationFee: import("@prisma/client/runtime/library").Decimal;
            minTeamMembers: number | null;
            maxTeamMembers: number | null;
            juknisUrl: string | null;
            maxRegistrants: number | null;
        };
    }>;
    getAllLevels(): Promise<{
        success: boolean;
        data: ({
            _count: {
                branches: number;
            };
            category: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                slug: string;
                description: string | null;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            slug: string;
            categoryId: string;
        })[];
    }>;
    getAllBranches(): Promise<{
        success: boolean;
        data: ({
            level: {
                category: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    createdAt: Date;
                    slug: string;
                    description: string | null;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                slug: string;
                categoryId: string;
            };
        } & {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            levelId: string;
            participantType: import(".prisma/client").$Enums.ParticipantType;
            registrationFee: import("@prisma/client/runtime/library").Decimal;
            minTeamMembers: number | null;
            maxTeamMembers: number | null;
            juknisUrl: string | null;
            maxRegistrants: number | null;
        })[];
    }>;
    deleteCategory(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            slug: string;
            description: string | null;
        };
    }>;
    deleteLevel(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            slug: string;
            categoryId: string;
        };
    }>;
    updateBranch(id: string, dto: UpdateBranchDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            levelId: string;
            participantType: import(".prisma/client").$Enums.ParticipantType;
            registrationFee: import("@prisma/client/runtime/library").Decimal;
            minTeamMembers: number | null;
            maxTeamMembers: number | null;
            juknisUrl: string | null;
            maxRegistrants: number | null;
        };
    }>;
    deleteBranch(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            levelId: string;
            participantType: import(".prisma/client").$Enums.ParticipantType;
            registrationFee: import("@prisma/client/runtime/library").Decimal;
            minTeamMembers: number | null;
            maxTeamMembers: number | null;
            juknisUrl: string | null;
            maxRegistrants: number | null;
        };
    }>;
    toggleBranch(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            levelId: string;
            participantType: import(".prisma/client").$Enums.ParticipantType;
            registrationFee: import("@prisma/client/runtime/library").Decimal;
            minTeamMembers: number | null;
            maxTeamMembers: number | null;
            juknisUrl: string | null;
            maxRegistrants: number | null;
        };
    }>;
}
