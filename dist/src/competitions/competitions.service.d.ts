import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateLevelDto, UpdateLevelDto, CreateBranchDto, UpdateBranchDto } from './dto/competition.dto';
export declare class CompetitionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getTree(): Promise<{
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
    }[]>;
    getBranchDetail(id: string): Promise<{
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
    }>;
    validateHierarchy(categoryId?: string, levelId?: string, branchId?: string): Promise<boolean>;
    getAllCategories(): Promise<({
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
    })[]>;
    createCategory(dto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        slug: string;
        description: string | null;
    }>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        slug: string;
        description: string | null;
    }>;
    toggleCategory(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        slug: string;
        description: string | null;
    }>;
    getLevelsByCategory(categoryId: string): Promise<({
        _count: {
            branches: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        categoryId: string;
    })[]>;
    createLevel(dto: CreateLevelDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        categoryId: string;
    }>;
    updateLevel(id: string, dto: UpdateLevelDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        categoryId: string;
    }>;
    getBranchesByLevel(levelId: string): Promise<{
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
    }[]>;
    createBranch(dto: CreateBranchDto): Promise<{
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
    }>;
    updateBranch(id: string, dto: UpdateBranchDto): Promise<{
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
    }>;
    getAllBranches(): Promise<({
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
    })[]>;
    getAllLevels(): Promise<({
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
    })[]>;
    deleteBranch(id: string): Promise<{
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
    }>;
    deleteLevel(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        slug: string;
        categoryId: string;
    }>;
    deleteCategory(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        slug: string;
        description: string | null;
    }>;
    toggleBranch(id: string): Promise<{
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
    }>;
}
