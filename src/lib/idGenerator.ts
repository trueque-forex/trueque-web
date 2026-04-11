/**
 * Generates an official Trueque ID (TID).
 * Format: T + YYYYMMDD + Country + Sequence + Checksum
 * Example: T20251229ES0001-X
 * 
 * @param countryCode - The 2-letter ISO country code (e.g., 'ES', 'MX')
 * @returns The formatted Trueque ID string
 */
export const generateTruequeID = (countryCode: string = 'XX'): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Clean country code
    const cleanCountry = (countryCode || 'XX').toUpperCase().substring(0, 2);

    // Mock Sequence (In production this would come from DB)
    const sequence = '0001';

    // Generate Checksum (Simple Modulo 36 logic for demo)
    const base = `S${dateStr}${cleanCountry}${sequence}`;
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
        sum += base.charCodeAt(i);
    }
    const checksumChar = chars[sum % chars.length];

    return `${base}-${checksumChar}`;
};
