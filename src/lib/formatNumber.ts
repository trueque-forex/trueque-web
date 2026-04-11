/**
 * Formats a number to a standard string with commas and 2 decimal places.
 * Example: 1234.56 -> "1,234.56"
 * 
 * @param value The number to format
 * @param locale The locale to use (default: 'en-US')
 * @returns Formatted string
 */
export const formatNumber = (value: number, locale: string = 'en-US'): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.00';

    return value.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};
