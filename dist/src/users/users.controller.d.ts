import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { ChangePasswordDto, ResetPasswordDto, ChangeRoleDto, CreateUserDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<{
        id: string;
        email: string;
        name: string;
        phoneNumber: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        sessionVersion: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    createUser(staffId: string, dto: CreateUserDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            sessionVersion: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    listUsers(search?: string, role?: Role, isActive?: string, page?: string, perPage?: string): Promise<{
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
        success: boolean;
    }>;
    toggleStatus(id: string, staffId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            sessionVersion: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    changeRole(id: string, staffId: string, dto: ChangeRoleDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            sessionVersion: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    resetPassword(id: string, staffId: string, dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkDeleteUsers(staffId: string, userIds: string[]): Promise<{
        success: boolean;
        message: string;
        deletedCount: number;
    }>;
    deleteUser(id: string, staffId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
