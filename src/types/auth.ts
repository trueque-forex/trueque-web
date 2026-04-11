export interface SessionUser {
    id: string;        // Strict: ONLY "id", no "userId"
    email: string;
    kycStatus: string; // Standardized: camelCase (mapped from kyc_status)
    userType: 'PEER' | 'MERCHANT';
    tid?: string;      // Optional: included for traceability
    symmetriId?: string; // Friendly name for ID display
    firstName?: string;
    lastName?: string;
    name?: string; // Full name helper
    txCount?: number; // Added for KYC logic
    phone?: string;
    country?: string;
    street_address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
}

export interface TruequeSession {
    user: SessionUser;
    expires: string;   // ISO string
    token?: string;    // Stateless token if needed
    mfaVerified?: boolean; // Added for Gemini 3 Middleware
}
