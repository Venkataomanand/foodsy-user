export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'ERROR', message: 'Method Not Allowed' });
    }

    const { restaurant_lat, restaurant_lng, user_lat, user_lng, gps_accuracy } = req.body;

    // STEP 1: Full Validation
    if (!restaurant_lat || !restaurant_lng || !user_lat || !user_lng ||
        isNaN(restaurant_lat) || isNaN(restaurant_lng) || isNaN(user_lat) || isNaN(user_lng)) {
        return res.status(400).json({ status: 'ERROR', message: 'INVALID_COORDINATES' });
    }

    // Rule: Validate ranges
    if (Math.abs(restaurant_lat) > 90 || Math.abs(restaurant_lng) > 180 || Math.abs(user_lat) > 90 || Math.abs(user_lng) > 180) {
        return res.status(400).json({ status: 'ERROR', message: 'INVALID_COORDINATES' });
    }

    // Use environment variable, fallback to original key for safety
    const API_KEY = process.env.GOOGLE_DIRECTIONS_API_KEY || "AIzaSyDG-s8L6iC2cYnDCAUpX6bZM4p0JRlyt08";

    try {
        console.log(`Distance calc: [${restaurant_lat},${restaurant_lng}] -> [${user_lat},${user_lng}]`);

        // STEP 2: Google Directions API (with local optimizations)
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${restaurant_lat},${restaurant_lng}&destination=${user_lat},${user_lng}&mode=driving&avoid=highways|tolls&key=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        let distanceKM, durationMinutes;

        if (data.status === 'OK' && data.routes?.[0]?.legs?.[0]) {
            const leg = data.routes[0].legs[0];
            distanceKM = parseFloat((leg.distance.value / 1000).toFixed(2));
            durationMinutes = Math.ceil(leg.duration.value / 60);
        } else {
            // STEP 3: Fallback Haversine (straight-line ~80% accurate)
            console.warn("Google API failed:", data.status, data.error_message || "");

            const haversine = (lat1, lon1, lat2, lon2) => {
                const R = 6371; // Earth radius in km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            distanceKM = parseFloat(haversine(restaurant_lat, restaurant_lng, user_lat, user_lng).toFixed(2));
            durationMinutes = Math.ceil(distanceKM * 4);  // ~15km/h avg delivery speed calculation
        }

        // STEP 4: Delivery Logic
        const deliveryCharge = parseFloat((distanceKM * 10).toFixed(2));
        const status = distanceKM <= 10 ? 'SERVICEABLE' : 'OUT_OF_RANGE';

        // STEP 5: Standard JSON Return Format
        return res.status(200).json({
            user_latitude: user_lat,
            user_longitude: user_lng,
            gps_accuracy_meters: gps_accuracy || 'UNKNOWN',
            restaurant_latitude: restaurant_lat,
            restaurant_longitude: restaurant_lng,
            road_distance_km: distanceKM,
            estimated_time_min: durationMinutes,
            delivery_charge: deliveryCharge,
            status: status,
            source: data.status === 'OK' ? 'GOOGLE' : 'HAVERSINE_FALLBACK',
            google_error: data.status !== 'OK' ? data.status : null
        });

    } catch (error) {
        console.error('Engine Error:', error);
        return res.status(500).json({ status: 'ERROR', message: 'INTERNAL_ERROR' });
    }
}
