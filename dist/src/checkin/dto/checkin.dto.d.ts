import { CheckInMethod } from '@prisma/client';
export declare class ScanCheckInDto {
    token: string;
    method: CheckInMethod;
    notes?: string;
}
