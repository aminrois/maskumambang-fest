import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChangePasswordDto, ResetPasswordDto } from './dto/user.dto';
import { Role, User } from '@prisma/client';
export declare class UsersService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    createUser(staffId: string, dto: import('./dto/user.dto').CreateUserDto): Promise<{
        id: string;
        email: string;
        name: string;
        phoneNumber: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        sessionVersion: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listUsers(search?: string, role?: Role, isActive?: boolean, page?: number, perPage?: number): Promise<{
        users: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            sessionVersion: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            perPage: number;
            totalPages: number;
        };
    }>;
    toggleActiveStatus(userId: string, staffId?: string): Promise<User>;
    changeRole(userId: string, newRole: Role, staffId?: string): Promise<User>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(staffId: string, targetUserId: string, dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteUser(staffId: string, targetUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkDeleteUsers(staffId: string, userIds: string[]): Promise<{
        success: boolean;
        message: string;
        deletedCount: number;
    }>;
}
