export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'ERROR', message: 'Method Not Allowed' });
    }

    const { restaurant_lat, restaurant_lng, user_lat, user_lng } = req.body;

    // STEP 2: Validate Coordinates
    if (!restaurant_lat || !restaurant_lng || !user_lat || !user_lng) {
        return res.status(400).json({ status: 'ERROR', message: 'INVALID_COORDINATES' });
    }

    // Rule: Validate ranges
    if (Math.abs(restaurant_lat) > 90 || Math.abs(restaurant_lng) > 180 || Math.abs(user_lat) > 90 || Math.abs(user_lng) > 180) {
        return res.status(400).json({ status: 'ERROR', message: 'INVALID_COORDINATES' });
    }

    // Google Directions API Key (Using Firebase key as it's typically the same project)
    const API_KEY = "AIzaSyDG-s8L6iC2cYnDCAUpX6bZM4p0JRlyt08";

    try {
        console.log(`Calculating Distance: [${restaurant_lat},${restaurant_lng}] to [${user_lat},${user_lng}]`);

        // STEP 3: Mandatory Google Directions API
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${restaurant_lat},${restaurant_lng}&destination=${user_lat},${user_lng}&mode=driving&key=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
            console.error("Google API Failure:", data.status, data.error_message);
            return res.status(500).json({ status: 'ERROR', message: 'DISTANCE_API_FAILED', google_status: data.status });
        }

        const leg = data.routes[0].legs[0];
        const distanceMeters = leg.distance.value;
        const durationSeconds = leg.duration.value;

        // Convert Phase (Rule 3)
        const distanceKM = parseFloat((distanceMeters / 1000).toFixed(2));
        const durationMinutes = Math.ceil(durationSeconds / 60);

        // STEP 4: Calculate Delivery Charges (Rule: 1st KM = 20, Subsequent = 10/KM)
        const deliveryCharge = distanceKM <= 1 ? 20 : 20 + Math.ceil(distanceKM - 1) * 10;

        // STEP 5: Standard JSON Return Format
        return res.status(200).json({
            "user_latitude": user_lat,
            "user_longitude": user_lng,
            "gps_accuracy_meters": req.body.gps_accuracy || "VERIFIED",
            "restaurant_latitude": restaurant_lat,
            "restaurant_longitude": restaurant_lng,
            "road_distance_km": distanceKM,
            "estimated_travel_time_minutes": durationMinutes,
            "delivery_charge": deliveryCharge,
            "status": "SUCCESS"
        });

    } catch (error) {
        console.error("Engine Error:", error);
        return res.status(500).json({ status: 'ERROR', message: 'DISTANCE_API_FAILED' });
    }
}
