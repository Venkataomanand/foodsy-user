// Username: venkata, Date: 20260228 -> VE-20260228-001 (If 1 letter, pad with 0 e.g., A0)
export const generateUserId = (username: string, dailySequence: number): string => {
    const prefix = username.length >= 2
        ? username.substring(0, 2).toUpperCase()
        : (username.charAt(0) + '0').toUpperCase();

    // Format Date to YYYYMMDD
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Sequence padded to 3 digits
    const seqStr = dailySequence.toString().padStart(3, '0');

    return `${prefix}-${dateStr}-${seqStr}`;
};

export const generateOrderId = (dailySequence: number): string => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqStr = dailySequence.toString().padStart(3, '0');
    return `ORD-${dateStr}-${seqStr}`;
};
