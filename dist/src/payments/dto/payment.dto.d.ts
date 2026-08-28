export declare class UploadPaymentDto {
    registrationId: string;
    paymentAccountId: string;
    senderBank?: string;
    senderAccountName?: string;
    paymentDate: string;
    notes?: string;
}
export declare class ReuploadPaymentDto {
    registrationId: string;
    paymentAccountId?: string;
    senderBank?: string;
    senderAccountName?: string;
    paymentDate?: string;
    notes?: string;
}
export declare class RejectPaymentDto {
    rejectionReason: string;
}
export declare class CreatePaymentAccountDto {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}
export declare class UpdatePaymentAccountDto {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
}
