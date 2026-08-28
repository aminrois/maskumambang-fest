import { PaymentsService } from './payments.service';
import { UploadPaymentDto, ReuploadPaymentDto, RejectPaymentDto, CreatePaymentAccountDto } from './dto/payment.dto';
import { PaymentStatus, Role } from '@prisma/client';
import { Response } from 'express';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getActiveAccounts(): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            bankName: string;
            accountNumber: string;
            accountHolder: string;
        }[];
    }>;
    getAllAccounts(): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            bankName: string;
            accountNumber: string;
            accountHolder: string;
        }[];
    }>;
    createAccount(dto: CreatePaymentAccountDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            bankName: string;
            accountNumber: string;
            accountHolder: string;
        };
    }>;
    updateAccount(id: string, dto: import('./dto/payment.dto').UpdatePaymentAccountDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            bankName: string;
            accountNumber: string;
            accountHolder: string;
        };
    }>;
    deleteAccount(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            bankName: string;
            accountNumber: string;
            accountHolder: string;
        };
    }>;
    toggleAccount(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            bankName: string;
            accountNumber: string;
            accountHolder: string;
        };
    }>;
    uploadPayment(userId: string, dto: UploadPaymentDto, file?: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            registrationId: string;
            paymentAccountId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            proofImagePath: string;
            senderBank: string | null;
            senderAccountName: string | null;
            paymentDate: Date;
            notes: string | null;
        };
    }>;
    reuploadPayment(userId: string, dto: ReuploadPaymentDto, file?: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            registrationId: string;
            paymentAccountId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            proofImagePath: string;
            senderBank: string | null;
            senderAccountName: string | null;
            paymentDate: Date;
            notes: string | null;
        };
    }>;
    listPayments(status?: PaymentStatus, search?: string, page?: string, perPage?: string): Promise<{
        payments: ({
            paymentAccount: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                bankName: string;
                accountNumber: string;
                accountHolder: string;
            } | null;
            registration: {
                user: {
                    id: string;
                    email: string;
                    name: string;
                    phoneNumber: string;
                };
                branch: {
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
                individualParticipant: {
                    id: string;
                    createdAt: Date;
                    registrationId: string;
                    fullName: string;
                    gender: import(".prisma/client").$Enums.Gender;
                    gradeClass: string;
                    schoolName: string;
                    schoolAddress: string;
                    mentorName: string;
                    whatsappNumber: string;
                } | null;
                team: {
                    id: string;
                    createdAt: Date;
                    registrationId: string;
                    schoolName: string;
                    schoolAddress: string;
                    mentorName: string;
                    whatsappNumber: string;
                    teamName: string;
                    leaderName: string;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                registrationNumber: string;
                qrCodeToken: string;
                userId: string;
                branchId: string;
                status: import(".prisma/client").$Enums.RegistrationStatus;
            };
            verificationLogs: ({
                verifiedBy: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                action: import(".prisma/client").$Enums.VerificationAction;
                rejectionReason: string | null;
                verifiedAt: Date;
                paymentId: string;
                verifiedByUserId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            registrationId: string;
            paymentAccountId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            proofImagePath: string;
            senderBank: string | null;
            senderAccountName: string | null;
            paymentDate: Date;
            notes: string | null;
        })[];
        pagination: {
            total: number;
            page: number;
            perPage: number;
            totalPages: number;
        };
        success: boolean;
    }>;
    approvePayment(paymentId: string, staffId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            registrationId: string;
            paymentAccountId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            proofImagePath: string;
            senderBank: string | null;
            senderAccountName: string | null;
            paymentDate: Date;
            notes: string | null;
        };
    }>;
    rejectPayment(paymentId: string, staffId: string, dto: RejectPaymentDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            registrationId: string;
            paymentAccountId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            proofImagePath: string;
            senderBank: string | null;
            senderAccountName: string | null;
            paymentDate: Date;
            notes: string | null;
        };
    }>;
    streamPaymentProof(filename: string, userId: string, role: Role, res: Response): Promise<void>;
}
