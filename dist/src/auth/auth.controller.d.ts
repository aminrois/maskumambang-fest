import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: Request, res: Response): Promise<{
        success: boolean;
        message: string;
        data: {
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
            accessToken: string;
        };
    }>;
    login(dto: LoginDto, req: Request, res: Response): Promise<{
        success: boolean;
        message: string;
        data: {
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
            accessToken: string;
        };
    }>;
    logout(res: Response): {
        success: boolean;
        message: string;
    };
}
