export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ status: 'ERROR', message: 'Method Not Allowed' });

    const { restaurant_lat, restaurant_lng, user_lat, user_lng, gps_accuracy } = req.body;

    // Swiggy GPS Accuracy Check (≤30m)
    const accuracy = parseInt(gps_accuracy || 999);
    if (accuracy > 30) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'LOW_GPS_ACCURACY',
            required: '≤30 meters',
            received: `${accuracy}m`
        });
    }

    // Coordinate validation...
    if (!restaurant_lat || !restaurant_lng || !user_lat || !user_lng ||
        isNaN(restaurant_lat) || isNaN(restaurant_lng) || isNaN(user_lat) || isNaN(user_lng)) {
        return res.status(400).json({ status: 'ERROR', message: 'INVALID_COORDINATES' });
    }

    const API_KEY = process.env.GOOGLE_DIRECTIONS_API_KEY; // FULL KEY REQUIRED

    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${restaurant_lat},${restaurant_lng}&destination=${user_lat},${user_lng}&mode=driving&avoid=highways|tolls&key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        let distanceKM, durationMinutes;
        if (data.status === 'OK' && data.routes?.[0]?.legs?.[0]) {
            const leg = data.routes[0].legs[0];
            distanceKM = parseFloat((leg.distance.value / 1000).toFixed(2));
            durationMinutes = Math.ceil(leg.duration.value / 60);
        } else {
            // Haversine fallback
            const haversine = (lat1, lon1, lat2, lon2) => {
                const R = 6371;
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };
            distanceKM = parseFloat(haversine(restaurant_lat, restaurant_lng, user_lat, user_lng).toFixed(2));
            durationMinutes = Math.ceil(distanceKM * 4);
        }

        // Swiggy Standard Pricing: ₹20 base for first 1km + ₹10 every remaining km 
        let deliveryCharge = 20;
        if (distanceKM > 1) {
            deliveryCharge += Math.ceil(distanceKM - 1) * 10;
        }

        const status = distanceKM <= 15 ? 'SERVICEABLE' : 'OUT_OF_RANGE';

        return res.status(200).json({
            gps_accuracy_meters: accuracy,
            restaurant_latitude: restaurant_lat,
            restaurant_longitude: restaurant_lng,
            user_latitude: user_lat,
            user_longitude: user_lng,
            road_distance_km: distanceKM,
            estimated_time_min: durationMinutes,
            delivery_charge: deliveryCharge,
            status: status,
            source: data.status === 'OK' ? 'GOOGLE_DIRECTIONS' : 'HAVERSINE_FALLBACK'
        });
    } catch (error) {
        console.error('Distance API Error:', error);
        return res.status(500).json({ status: 'ERROR', message: 'API_FAILED' });
    }
}
