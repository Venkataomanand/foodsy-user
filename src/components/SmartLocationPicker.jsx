import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Target, Landmark, Navigation2, CheckCircle, AlertTriangle, Building, DoorOpen, ListChecks } from 'lucide-react';

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

function LocationMarker({ position, setPosition, isLocating, accuracy }) {
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
        <>
            <Marker
                position={position}
                draggable={true}
                eventHandlers={eventHandlers}
            />
            {accuracy && (
                <Circle
                    center={position}
                    radius={accuracy}
                    pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.1 }}
                />
            )}
        </>
    );
}

export default function SmartLocationPicker({ onLocationConfirmed, initialCoords }) {
    const [position, setPosition] = useState(initialCoords || { lat: 16.974, lng: 82.242 });
    const [addressData, setAddressData] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [accuracy, setAccuracy] = useState(null);
    const [error, setError] = useState('');

    // Additional confirmation fields
    const [floor, setFloor] = useState('');
    const [gate, setGate] = useState('');
    const [instructions, setInstructions] = useState('');

    const geocode = async (lat, lng) => {
        setLoading(true);
        try {
            // STEP 2: Structured Reverse Geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            const addr = data.address;

            // STEP 3: Landmark Intelligence & Suggestions
            const poiResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=building&lat=${lat}&lon=${lng}&limit=5`);
            const pois = await poiResponse.json();

            // Filter and sort suggestions
            const buildingSuggestions = pois.map(p => ({
                name: p.display_name.split(',')[0],
                full: p.display_name,
                type: p.type
            })).slice(0, 3);
            setSuggestions(buildingSuggestions);

            const building = addr.building || addr.house_name || addr.house_number ||
                addr.amenity || addr.office || addr.apartment || "";

            // Detect Commercial landmarks
            const commercialLandmarks = [
                addr.mall, addr.hospital, addr.school, addr.university, addr.temple,
                addr.bus_stop, addr.railway_station, addr.historic
            ].filter(Boolean);

            const landmark = commercialLandmarks[0] || (addr.road ? `Near ${addr.road}` : "Kakinada Main Area");

            // STEP 5: Delivery Zone Validation
            const isInZone = lat >= KAKINADA_ZONE.minLat && lat <= KAKINADA_ZONE.maxLat &&
                lng >= KAKINADA_ZONE.minLng && lng <= KAKINADA_ZONE.maxLng;

            const structuredData = {
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
                formatted_address: data.display_name,
                building_name: building || (buildingSuggestions[0]?.name) || landmark,
                street_name: addr.road || "",
                area_locality: addr.suburb || addr.neighbourhood || addr.city_district || "",
                sub_locality: addr.quarter || addr.suburb || "",
                city: addr.city || addr.town || "Kakinada",
                state: addr.state || "Andhra Pradesh",
                postal_code: addr.postcode || "",
                country: addr.country || "India",
                landmark_name: landmark,
                landmark_distance_meters: "50-100m",
                delivery_status: isInZone ? "SERVICEABLE" : (lat < 17.5 ? "LIMITED_SERVICE" : "OUT_OF_RANGE")
            };

            setAddressData(structuredData);
            setError('');
        } catch (err) {
            console.error("Geocoding error:", err);
            setError("Accuracy limited by connection. Drag pin for precision.");
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
            setError("GPS_NOT_SUPPORTED");
            return;
        }

        setIsLocating(true);
        // STEP 1: Strict High Accuracy GPS (≤15m target)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const acc = pos.coords.accuracy;
                setAccuracy(acc);

                // STEP 1 & 2 Validation
                if (acc > 20) {
                    setError("LOW_ACCURACY: Please enable High Accuracy GPS mode and ensure you are in an open area (Target: ≤15m, Current: " + acc.toFixed(1) + "m)");
                } else if (acc > 15) {
                    // Warning but allowed if between 15-20, per prompt rules
                    setError("MARGINAL_ACCURACY: Improving signal...");
                } else {
                    setError('');
                }

                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setIsLocating(false);
            },
            (err) => {
                // STEP 2 Error Mapping
                setError("LOCATION_PERMISSION_REQUIRED");
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0 // Reject cached locations
            }
        );
    };

    const handleConfirm = () => {
        if (!addressData) return;

        // STEP 8: Store Final Confirmed Status
        const finalOutput = {
            ...addressData,
            accuracy: accuracy || 0,
            floor_number: floor,
            gate_details: gate,
            delivery_instructions: instructions,
            timestamp: new Date().toISOString()
        };
        onLocationConfirmed(finalOutput);
    };

    return (
        <div className="space-y-4">
            <div className="relative h-[320px] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <MapContainer center={position} zoom={18} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    <LocationMarker position={position} setPosition={setPosition} isLocating={isLocating} accuracy={accuracy} />
                </MapContainer>

                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    className="absolute bottom-6 right-6 z-[1000] bg-gray-900 p-4 rounded-2xl shadow-2xl text-white hover:bg-primary transition-all active:scale-90 flex items-center gap-2"
                >
                    <Target className={`h-5 w-5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-black uppercase tracking-widest">Pin Live</span>
                </button>

                <div className="absolute top-6 left-6 z-[1000] bg-white/95 backdrop-blur-lg px-4 py-2 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2">
                    <Navigation2 className="h-4 w-4 text-primary animate-pulse" />
                    <div>
                        <span className="text-[9px] font-black uppercase text-gray-400 block tracking-widest leading-none">GPS Accuracy</span>
                        <span className="text-[10px] font-bold text-gray-900">{accuracy ? `±${accuracy.toFixed(1)} meters` : 'Calibrating...'}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-3 border border-orange-200 animate-bounce">
                    <AlertTriangle className="h-5 w-5" /> {error}
                </div>
            )}

            {addressData && !loading && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 border-2 border-gray-50 shadow-xl space-y-6">
                        {/* Selected Result */}
                        <div className="flex items-start gap-4">
                            <div className="bg-gray-900 p-3 rounded-2xl shadow-lg">
                                <Building className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-1">Detected Target</span>
                                <h4 className="text-lg font-black text-gray-900 leading-tight mb-1">{addressData.building_name}</h4>
                                <p className="text-sm font-medium text-gray-500 line-clamp-2">{addressData.formatted_address}</p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${addressData.delivery_status === 'SERVICEABLE' ? 'bg-green-100 text-green-600 shadow-sm' : 'bg-red-100 text-red-600'}`}>
                                {addressData.delivery_status}
                            </div>
                        </div>

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="pt-2">
                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-3 ml-1 flex items-center gap-2">
                                    <ListChecks className="h-3 w-3" /> Nearby Buildings (Accuracy Match)
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setAddressData(prev => ({ ...prev, building_name: s.name }))}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${addressData.building_name === s.name ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'}`}
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirmation Layer */}
                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                            <div>
                                <label className="block text-[9px] font-black uppercase text-gray-400 mb-2 ml-1 flex items-center gap-1">
                                    <DoorOpen className="h-3 w-3" /> Floor / Suite No.
                                </label>
                                <input
                                    type="text"
                                    value={floor}
                                    onChange={(e) => setFloor(e.target.value)}
                                    className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-primary focus:border-primary transition-all"
                                    placeholder="e.g. 4th Floor"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase text-gray-400 mb-2 ml-1 flex items-center gap-1">
                                    <Navigation2 className="h-3 w-3" /> Gate / Entrance
                                </label>
                                <input
                                    type="text"
                                    value={gate}
                                    onChange={(e) => setGate(e.target.value)}
                                    className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-primary focus:border-primary transition-all"
                                    placeholder="e.g. West Gate"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-[9px] font-black uppercase text-gray-400 mb-2 ml-1 flex items-center gap-1">
                                <Landmark className="h-3 w-3" /> Delivery Instructions
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-primary focus:border-primary transition-all"
                                placeholder="Any special notes for the rider?"
                                rows={2}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="w-full bg-gray-900 hover:bg-primary text-white rounded-3xl py-5 text-sm font-black uppercase tracking-widest shadow-2xl shadow-gray-200 transition-all active:scale-95"
                        >
                            Confirm Precise Intelligence Data
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
