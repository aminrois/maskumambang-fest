import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Request } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
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
    login(dto: LoginDto, req: Request): Promise<{
        success: boolean;
        message: string;
        data: {
            accessToken: string;
            user: {
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
        };
    }>;
}
