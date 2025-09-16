/**
 * Helper function to filter object fields based on include/exclude params
 * @param obj Object to filter fields from
 * @param include Raw include query parameter (string or undefined)
 * @param exclude Raw exclude query parameter (string or undefined)
 * @returns Filtered object
 */
export const filterFields = (obj: any, include?: any, exclude?: any) => {
    // Parse parameters if they exist
    const includeFields = include ? (include as string).split(',') : undefined;
    const excludeFields = exclude ? (exclude as string).split(',') : undefined;

    if (!includeFields && !excludeFields) return obj;

    if (includeFields && includeFields.length > 0) {
        const filtered: any = {};
        includeFields.forEach(field => {
            if (obj[field] !== undefined) {
                filtered[field] = obj[field];
            }
        });
        return filtered;
    }

    if (excludeFields && excludeFields.length > 0) {
        const filtered = { ...obj };
        excludeFields.forEach(field => {
            delete filtered[field];
        });
        return filtered;
    }

    return obj;
};

/**
 * Parse a date string or timestamp into a Date object
 * Supports formats: 
 * - Unix timestamp (number or string)
 * - "YYYY/MM/DD"
 * - "YYYY-MM-DD"
 * - "YYYY-MM-DD HH:MM:SS"
 * 
 * @param dateInput Date input as string or number
 * @returns Date object or null if invalid
 */
export const parseDate = (dateInput: string | number | undefined): Date | null => {
    if (!dateInput) return null;

    // Try parsing as number (timestamp)
    if (typeof dateInput === 'number' || !isNaN(Number(dateInput))) {
        const date = new Date(Number(dateInput));
        return isValidDate(date) ? date : null;
    }

    // Try parsing "YYYY/MM/DD" format
    if (dateInput.includes('/')) {
        const date = new Date(dateInput);
        return isValidDate(date) ? date : null;
    }

    // Try parsing "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" format
    if (dateInput.includes('-')) {
        const date = new Date(dateInput);
        return isValidDate(date) ? date : null;
    }

    return null;
};

/**
 * Check if a date is valid
 * @param date Date to validate
 * @returns boolean indicating if date is valid
 */
const isValidDate = (date: Date): boolean => {
    return !isNaN(date.getTime());
}; 