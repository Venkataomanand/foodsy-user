export const validateMobileNumber = (mobile: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(mobile);
};

export const validateCheckoutData = (data: any) => {
    if (!data.mobileNumber || !validateMobileNumber(data.mobileNumber)) {
        return { error: 'Invalid mobile number. Must be exactly 10 numeric digits.' };
    }
    if (!data.cartItems || data.cartItems.length === 0) {
        return { error: 'Cart is empty.' };
    }
    return { error: null };
};
