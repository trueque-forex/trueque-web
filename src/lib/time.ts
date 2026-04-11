/**
 * UTC Time Helper
 * Standardizes time generation across the application.
 */

/**
 * Returns the current time as a Date object.
 * in Node.js/JS, new Date() is effectively UTC-agnostic (epoch),
 * but this helper makes intent explicit.
 */
export const getUtcDate = (): Date => {
    return new Date();
};

/**
 * Returns the current time as an ISO 8601 string (UTC).
 * Example: '2023-10-05T14:48:00.000Z'
 */
export const getUtcIso = (): string => {
    return new Date().toISOString();
};
