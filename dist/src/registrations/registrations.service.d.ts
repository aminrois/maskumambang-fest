import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { CreateIndividualRegistrationDto } from './dto/create-individual.dto';
import { CreateTeamRegistrationDto } from './dto/create-team.dto';
import { RegistrationStatus, Role } from '@prisma/client';
export declare class RegistrationsService {
    private readonly prisma;
    private readonly auditService;
    private readonly configService;
    constructor(prisma: PrismaService, auditService: AuditService, configService: ConfigService);
    private generateRegistrationNumber;
    private generateQrToken;
    createIndividual(userId: string, dto: CreateIndividualRegistrationDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
        };
        payments: ({
            paymentAccount: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                bankName: string;
                accountNumber: string;
                accountHolder: string;
                qrisImagePath: string | null;
            } | null;
            verificationLogs: ({
                verifiedBy: {
                    id: string;
                    name: string;
                    role: import(".prisma/client").$Enums.Role;
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
        team: ({
            members: {
                id: string;
                createdAt: Date;
                gender: import(".prisma/client").$Enums.Gender;
                gradeClass: string;
                teamId: string;
                memberName: string;
                positionRole: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            registrationId: string;
            schoolName: string;
            schoolAddress: string;
            mentorName: string;
            whatsappNumber: string;
            teamName: string;
            leaderName: string;
        }) | null;
        checkIn: ({
            checkedInBy: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            registrationId: string;
            notes: string | null;
            checkedInByUserId: string;
            checkInMethod: import(".prisma/client").$Enums.CheckInMethod;
            checkInTime: Date;
            checkIn2Time: Date | null;
            checkIn2ByUserId: string | null;
            checkIn2Method: import(".prisma/client").$Enums.CheckInMethod | null;
            notes2: string | null;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        registrationNumber: string;
        qrCodeToken: string;
        userId: string;
        branchId: string;
        status: import(".prisma/client").$Enums.RegistrationStatus;
    }>;
    createTeam(userId: string, dto: CreateTeamRegistrationDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
        };
        payments: ({
            paymentAccount: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                bankName: string;
                accountNumber: string;
                accountHolder: string;
                qrisImagePath: string | null;
            } | null;
            verificationLogs: ({
                verifiedBy: {
                    id: string;
                    name: string;
                    role: import(".prisma/client").$Enums.Role;
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
        team: ({
            members: {
                id: string;
                createdAt: Date;
                gender: import(".prisma/client").$Enums.Gender;
                gradeClass: string;
                teamId: string;
                memberName: string;
                positionRole: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            registrationId: string;
            schoolName: string;
            schoolAddress: string;
            mentorName: string;
            whatsappNumber: string;
            teamName: string;
            leaderName: string;
        }) | null;
        checkIn: ({
            checkedInBy: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            registrationId: string;
            notes: string | null;
            checkedInByUserId: string;
            checkInMethod: import(".prisma/client").$Enums.CheckInMethod;
            checkInTime: Date;
            checkIn2Time: Date | null;
            checkIn2ByUserId: string | null;
            checkIn2Method: import(".prisma/client").$Enums.CheckInMethod | null;
            notes2: string | null;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        registrationNumber: string;
        qrCodeToken: string;
        userId: string;
        branchId: string;
        status: import(".prisma/client").$Enums.RegistrationStatus;
    }>;
    getUserRegistrations(userId: string): Promise<({
        payments: ({
            paymentAccount: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                bankName: string;
                accountNumber: string;
                accountHolder: string;
                qrisImagePath: string | null;
            } | null;
            verificationLogs: {
                id: string;
                action: import(".prisma/client").$Enums.VerificationAction;
                rejectionReason: string | null;
                verifiedAt: Date;
                paymentId: string;
                verifiedByUserId: string;
            }[];
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
        team: ({
            members: {
                id: string;
                createdAt: Date;
                gender: import(".prisma/client").$Enums.Gender;
                gradeClass: string;
                teamId: string;
                memberName: string;
                positionRole: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            registrationId: string;
            schoolName: string;
            schoolAddress: string;
            mentorName: string;
            whatsappNumber: string;
            teamName: string;
            leaderName: string;
        }) | null;
        checkIn: ({
            checkedInBy: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            registrationId: string;
            notes: string | null;
            checkedInByUserId: string;
            checkInMethod: import(".prisma/client").$Enums.CheckInMethod;
            checkInTime: Date;
            checkIn2Time: Date | null;
            checkIn2ByUserId: string | null;
            checkIn2Method: import(".prisma/client").$Enums.CheckInMethod | null;
            notes2: string | null;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        registrationNumber: string;
        qrCodeToken: string;
        userId: string;
        branchId: string;
        status: import(".prisma/client").$Enums.RegistrationStatus;
    })[]>;
    getRegistrationById(id: string, requesterUserId: string, requesterRole: Role): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            phoneNumber: string;
        };
        payments: ({
            paymentAccount: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                bankName: string;
                accountNumber: string;
                accountHolder: string;
                qrisImagePath: string | null;
            } | null;
            verificationLogs: ({
                verifiedBy: {
                    id: string;
                    name: string;
                    role: import(".prisma/client").$Enums.Role;
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
        team: ({
            members: {
                id: string;
                createdAt: Date;
                gender: import(".prisma/client").$Enums.Gender;
                gradeClass: string;
                teamId: string;
                memberName: string;
                positionRole: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            registrationId: string;
            schoolName: string;
            schoolAddress: string;
            mentorName: string;
            whatsappNumber: string;
            teamName: string;
            leaderName: string;
        }) | null;
        checkIn: ({
            checkedInBy: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
            };
        } & {
            id: string;
            registrationId: string;
            notes: string | null;
            checkedInByUserId: string;
            checkInMethod: import(".prisma/client").$Enums.CheckInMethod;
            checkInTime: Date;
            checkIn2Time: Date | null;
            checkIn2ByUserId: string | null;
            checkIn2Method: import(".prisma/client").$Enums.CheckInMethod | null;
            notes2: string | null;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        registrationNumber: string;
        qrCodeToken: string;
        userId: string;
        branchId: string;
        status: import(".prisma/client").$Enums.RegistrationStatus;
    }>;
    listAllRegistrations(search?: string, status?: RegistrationStatus, branchId?: string, page?: number, perPage?: number): Promise<{
        registrations: ({
            user: {
                id: string;
                email: string;
                name: string;
                phoneNumber: string;
            };
            payments: {
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
            }[];
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
            team: ({
                members: {
                    id: string;
                    createdAt: Date;
                    gender: import(".prisma/client").$Enums.Gender;
                    gradeClass: string;
                    teamId: string;
                    memberName: string;
                    positionRole: string | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                registrationId: string;
                schoolName: string;
                schoolAddress: string;
                mentorName: string;
                whatsappNumber: string;
                teamName: string;
                leaderName: string;
            }) | null;
            checkIn: {
                id: string;
                registrationId: string;
                notes: string | null;
                checkedInByUserId: string;
                checkInMethod: import(".prisma/client").$Enums.CheckInMethod;
                checkInTime: Date;
                checkIn2Time: Date | null;
                checkIn2ByUserId: string | null;
                checkIn2Method: import(".prisma/client").$Enums.CheckInMethod | null;
                notes2: string | null;
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
        })[];
        pagination: {
            total: number;
            page: number;
            perPage: number;
            totalPages: number;
        };
    }>;
}
