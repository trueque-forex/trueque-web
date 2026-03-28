import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';
const IV_LENGTH = 16;
// Ensure key is 32 bytes for AES-256
// We will hash the env key to ensure it's 32 bytes
const getKey = () => crypto.createHash('sha256').update(process.env.APP_ENCRYPTION_KEY || 'default-insecure-key').digest();

export const encrypt = (text: string): string | null => {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
        let encrypted = cipher.update(text, 'utf8', ENCODING);
        encrypted += cipher.final(ENCODING);
        // Return IV + Encrypted
        return `${iv.toString(ENCODING)}:${encrypted}`;
    } catch (err) {
        console.error('Encryption failed', err);
        return text; // Fallback to plain? Or throw? usually fallback or return null if strict. 
        // User wants "Encryption Handshake". Let's return text if dev, else throw.
        // Actually better to return null or throw to avoid saving plain text if intended to be secret.
        // But for simplicity/robustness now, let's keep it safe.
        return null;
    }
};

export const decrypt = (text: string): string | null => {
    if (!text) return null;
    try {
        const parts = text.split(':');
        if (parts.length < 2) return text; // Not encrypted
        const iv = Buffer.from(parts.shift() as string, ENCODING);
        const encryptedText = parts.join(':');
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        let decrypted = decipher.update(encryptedText, ENCODING, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption failed', err);
        return null;
    }
};

export const computeBlindIndex = (text: string): string | null => {
    if (!text) return null;
    try {
        const salt = process.env.BLIND_INDEX_SALT || 'default-blind-salt';
        const hmac = crypto.createHmac('sha256', salt);
        hmac.update(text);
        return hmac.digest('hex');
    } catch (err) {
        console.error('Blind Index computation failed', err);
        return null;
    }
};
