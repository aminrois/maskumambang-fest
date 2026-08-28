import { Role } from '@prisma/client';
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class ResetPasswordDto {
    newPassword: string;
}
export declare class ChangeRoleDto {
    role: Role;
}
export declare class CreateUserDto {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    role?: Role;
}
