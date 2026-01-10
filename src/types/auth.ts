export interface TruequeSession {
    user: {
        id: string;        // This is the ONLY allowed key for the User UUID
        email: string;
        kycStatus: string; // To be synced with our database status
        userType: 'PEER' | 'MERCHANT';
    };
    expires: string;
}
