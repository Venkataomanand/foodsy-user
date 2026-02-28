export const calculateDeliveryFee = (distance: number): number => {
    // Distance mapped as rounded up to nearest KM in calculation so it's an integer >= 0
    if (distance <= 1) {
        return 15;
    }

    // Add ₹10 per extra KM
    return 15 + ((Math.ceil(distance) - 1) * 10);
};
