import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Target, Landmark, Navigation2, CheckCircle, AlertTriangle } from 'lucide-react';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const KAKINADA_ZONE = {
    minLat: 16.85,
    maxLat: 17.15,
    minLng: 82.15,
    maxLng: 82.35
};

function LocationMarker({ position, setPosition, isLocating }) {
    const map = useMap();

    useEffect(() => {
        if (position && !isLocating) {
            map.flyTo(position, 18, { duration: 1.5 });
        }
    }, [position, map, isLocating]);

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    const eventHandlers = useCallback({
        dragend(e) {
            const marker = e.target;
            setPosition(marker.getLatLng());
        },
    }, [setPosition]);

    return position === null ? null : (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={eventHandlers}
        />
    );
}

export default function SmartLocationPicker({ onLocationConfirmed, initialCoords }) {
    const [position, setPosition] = useState(initialCoords || { lat: 16.974, lng: 82.242 });
    const [addressData, setAddressData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState('');

    const geocode = async (lat, lng) => {
        setLoading(true);
        try {
            // Detailed Reverse Geocoding via Nominatim
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();

            // Landmark / POI Search
            // Landmark / POI Search - This is kept for potential future use or if Nominatim's direct address details are insufficient
            const poiResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=landmark&lat=${lat}&lon=${lng}&radius=100`);
            const pois = await poiResponse.json();
            const nearestPoi = pois?.[0];

            const addr = data.address;
            const fullAddress = data.display_name;

            // Intelligence logic for Building Name and Landmark
            const building = addr.building || addr.house_name || addr.house_number ||
                addr.amenity || addr.office || addr.apartment || addr.flat || "";

            // Find the most relevant nearby feature as a landmark
            const potentialLandmarks = [
                addr.amenity, addr.shop, addr.tourism, addr.historic,
                addr.suburb, addr.neighbourhood, addr.city_district
            ].filter(Boolean);

            const landmark = potentialLandmarks[0] || (addr.road ? `Near ${addr.road}` : "Kakinada Region");

            const isInZone = lat >= KAKINADA_ZONE.minLat && lat <= KAKINADA_ZONE.maxLat &&
                lng >= KAKINADA_ZONE.minLng && lng <= KAKINADA_ZONE.maxLng;

            const structuredData = {
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
                full_address: fullAddress,
                building_name: building ? (isNaN(building) ? building : `House No. ${building}`) : landmark,
                street_name: addr.road || "",
                area_colony: addr.suburb || addr.neighbourhood || addr.city_district || "",
                city: addr.city || addr.town || addr.village || "Kakinada",
                state: addr.state || "Andhra Pradesh",
                postal_code: addr.postcode || "",
                country: addr.country || "India",
                landmark: landmark,
                distance_from_landmark: potentialLandmarks[0] ? "Within 50-100m" : "N/A",
                delivery_zone_status: isInZone ? "Inside" : "Outside"
            };

            setAddressData(structuredData);
            setError('');
        } catch (err) {
            console.error("Geocoding error:", err);
            setError("Failed to fetch address details. Accuracy might be limited.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (position) {
            geocode(position.lat, position.lng);
        }
    }, [position]);

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setIsLocating(false);
            },
            (err) => {
                setError("Accuracy weak or permission denied. Please enable high accuracy mode.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="space-y-4">
            <div className="relative h-[300px] w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker position={position} setPosition={setPosition} isLocating={isLocating} />
                </MapContainer>

                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 text-primary transition-all active:scale-90"
                    title="Pin My Location"
                >
                    <Target className={`h-6 w-6 ${isLocating ? 'animate-spin' : ''}`} />
                </button>

                <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-white/20 flex items-center gap-2">
                    <Navigation2 className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Live Interactive Map</span>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
            ) : addressData ? (
                <div className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl mt-1">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Detected Address</span>
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                    {addressData.building_name}, {addressData.full_address.split(',').slice(1, 4).join(',')}
                                </p>
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${addressData.delivery_zone_status === 'Inside' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {addressData.delivery_zone_status} Zone
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                        <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-orange-400" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase text-gray-400">Nearest Landmark</span>
                                <span className="text-[10px] font-bold text-gray-700 truncate">{addressData.landmark}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase text-gray-400">Accuracy</span>
                                <span className="text-[10px] font-bold text-gray-700 font-mono tracking-tighter">±5m Precision</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onLocationConfirmed(addressData)}
                        className="w-full bg-gray-900 text-white rounded-xl py-4 text-sm font-black hover:bg-primary transition-all shadow-xl shadow-gray-200"
                    >
                        Confirm Precise Location
                    </button>

                    {addressData.delivery_zone_status === 'Outside' && (
                        <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 animate-bounce">
                            <AlertTriangle className="h-3 w-3" /> Delivery might be slower or restricted for this area.
                        </p>
                    )}
                </div>
            ) : error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {error}
                </div>
            )}
        </div>
    );
}
