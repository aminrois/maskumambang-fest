import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { UploadPaymentDto, ReuploadPaymentDto, RejectPaymentDto, CreatePaymentAccountDto } from './dto/payment.dto';
import { PaymentStatus, Role } from '@prisma/client';
export declare class PaymentsService {
    private readonly prisma;
    private readonly auditService;
    private readonly configService;
    private readonly uploadDir;
    constructor(prisma: PrismaService, auditService: AuditService, configService: ConfigService);
    getActiveAccounts(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    }[]>;
    getAllAccounts(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    }[]>;
    createAccount(dto: CreatePaymentAccountDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    }>;
    updateAccount(id: string, dto: import('./dto/payment.dto').UpdatePaymentAccountDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    }>;
    deleteAccount(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    }>;
    toggleAccount(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    }>;
    uploadPayment(userId: string, dto: UploadPaymentDto, fileBuffer: Buffer, originalFilename?: string): Promise<{
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
    }>;
    reuploadPayment(userId: string, dto: ReuploadPaymentDto, fileBuffer: Buffer, originalFilename?: string): Promise<{
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
    }>;
    listPayments(status?: PaymentStatus, search?: string, page?: number, perPage?: number): Promise<{
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
    }>;
    approvePayment(paymentId: string, staffId: string): Promise<{
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
    }>;
    rejectPayment(paymentId: string, staffId: string, dto: RejectPaymentDto): Promise<{
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
    }>;
    getPaymentProofFile(filename: string, requesterUserId: string, requesterRole: Role): Promise<{
        filePath: string;
        filename: string;
    }>;
}
