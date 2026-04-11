/**
 * Standardized Error Codes for Trueque Application
 */
export enum ErrorCode {
    // Auth
    AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
    AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
    AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
    AUTH_USER_ALREADY_EXISTS = 'AUTH_USER_ALREADY_EXISTS',

    // KYC / Compliance
    KYC_REQUIRED = 'KYC_REQUIRED',
    KYC_LIMIT_EXCEEDED = 'KYC_LIMIT_EXCEEDED',
    KYC_PENDING = 'KYC_PENDING',

    // Transactions
    TX_INSUFFICIENT_FUNDS = 'TX_INSUFFICIENT_FUNDS',
    TX_LIMIT_EXCEEDED = 'TX_LIMIT_EXCEEDED',
    TX_DUPLICATE = 'TX_DUPLICATE',
    TX_INVALID_STATE = 'TX_INVALID_STATE',

    // System
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    BAD_REQUEST = 'BAD_REQUEST',
    NOT_FOUND = 'NOT_FOUND',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Standard Application Error class
 */
export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly metadata?: Record<string, any>;

    constructor(code: ErrorCode, message: string, statusCode: number = 400, metadata?: Record<string, any>) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.metadata = metadata;

        // Maintain prototype chain for instanceof checks
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static fromError(err: unknown): AppError {
        if (err instanceof AppError) return err;
        if (err instanceof Error) return new AppError(ErrorCode.INTERNAL_SERVER_ERROR, err.message, 500);
        return new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Unknown error occurred', 500);
    }

    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                metadata: this.metadata,
            }
        };
    }
}
