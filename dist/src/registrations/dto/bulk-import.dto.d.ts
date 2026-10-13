import { Gender, RegistrationStatus } from '@prisma/client';
export declare class BulkImportSchoolAccountDto {
    mode: 'existing' | 'new';
    existingUserId?: string;
    schoolName?: string;
    mentorName?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
}
export declare class BulkImportItemDto {
    fullName: string;
    gender: Gender;
    branchName: string;
    levelName?: string;
    categoryName?: string;
    branchId?: string;
    gradeClass: string;
    birthDate?: string;
    schoolName?: string;
    schoolAddress?: string;
    mentorName?: string;
    whatsappNumber?: string;
}
export declare class BulkImportRegistrationDto {
    schoolAccount: BulkImportSchoolAccountDto;
    status: RegistrationStatus;
    notes?: string;
    items: BulkImportItemDto[];
}
