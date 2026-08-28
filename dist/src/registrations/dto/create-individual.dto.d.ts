import { Gender } from '@prisma/client';
export declare class CreateIndividualRegistrationDto {
    branchId: string;
    fullName: string;
    gender: Gender;
    gradeClass: string;
    schoolName: string;
    schoolAddress: string;
    mentorName: string;
    whatsappNumber: string;
}
