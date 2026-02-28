export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return Math.ceil(distance); // Round up to nearest KM
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

export const calculateDeliveryFee = (distance: number): number => {
    // Distance mapped as rounded up to nearest KM in calculation so it's an integer >= 0
    if (distance <= 1) {
        return 15;
    }

    // Add ₹10 per extra KM
    return 15 + ((Math.ceil(distance) - 1) * 10);
};
