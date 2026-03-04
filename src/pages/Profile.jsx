import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Loader, User, Mail, MapPin, Building2, LogOut, Edit2, Check, X, Landmark, Navigation, NotebookText } from 'lucide-react';
import SmartLocationPicker from '../components/SmartLocationPicker';

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit form states
    const [editUsername, setEditUsername] = useState('');
    const [editLocationData, setEditLocationData] = useState(null); // Stores { lat, lng, full_address, building_name, landmark, delivery_zone_status }
    const [editInstructions, setEditInstructions] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserData(data);
                    setEditUsername(data.username || currentUser.displayName || '');
                    setEditInstructions(data.delivery_instructions || '');
                    // Prepare initial location for picker if it exists
                    if (data.latitude && data.longitude) {
                        setEditLocationData({
                            lat: Number(data.latitude),
                            lng: Number(data.longitude),
                            full_address: data.full_address || data.address,
                            building_name: data.building_name,
                            landmark: data.landmark,
                            delivery_zone_status: data.delivery_zone_status
                        });
                    }
                } else {
                    setEditUsername(currentUser.displayName || '');
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser, navigate]);

    const triggerValidationShake = () => {
        setShake(true);
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => setShake(false), 500);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const handleLocationConfirmed = (data) => {
        setEditLocationData(data);
        setError('');
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (editUsername.length < 3 || !/^[a-zA-Z0-9_]+$/.test(editUsername)) {
            setError('Username must be at least 3 characters.');
            triggerValidationShake();
            return;
        }

        if (!editLocationData && !userData?.address) { // Check if no new location data and no existing address
            setError('Please pin your delivery location.');
            triggerValidationShake();
            return;
        }

        try {
            setError('');
            setSaving(true);

            // Update auth profile
            await updateProfile(currentUser, { displayName: editUsername });

            const updatedLocation = editLocationData ? {
                latitude: editLocationData.lat,
                longitude: editLocationData.lng,
                full_address: editLocationData.full_address,
                building_name: editLocationData.building_name || null,
                landmark: editLocationData.landmark || null,
                delivery_zone_status: editLocationData.delivery_zone_status || null,
                delivery_instructions: editInstructions,
                updatedAt: new Date().toISOString()
            } : {
                // If location picker wasn't used, but instructions were updated
                delivery_instructions: editInstructions,
                updatedAt: new Date().toISOString()
            };

            // Update firestore document
            await updateDoc(doc(db, 'users', currentUser.uid), {
                username: editUsername,
                ...updatedLocation
            });

            setUserData(prev => ({
                ...prev,
                username: editUsername,
                ...updatedLocation
            }));

            setIsEditing(false);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } catch (err) {
            setError("Failed to update profile: " + err.message);
            triggerValidationShake();
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex justify-center items-center">
                <Loader className="animate-spin h-10 w-10 text-orange-600" />
            </div>
        );
    }

    const initials = userData?.username?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <div className="min-h-screen bg-orange-50 py-12 px-4 sm:px-6 lg:px-8 font-[Poppins]">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-orange-600 tracking-tight">Your Profile</h1>
                </div>

                {/* Profile Card */}
                <div className={`bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100 transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}>
                    {/* Cover Photo Area */}
                    <div className="h-32 bg-gradient-to-r from-orange-400 to-primary relative"></div>

                    {/* Avatar Container */}
                    <div className="relative px-8 pb-8 flex flex-col items-center -mt-16">
                        <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg mb-4">
                            <div className="w-full h-full rounded-full bg-orange-100 flex justify-center items-center text-5xl font-black text-orange-600 border-4 border-white shadow-inner">
                                {initials}
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="absolute top-4 right-8 p-2 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                                title="Edit Profile"
                            >
                                <Edit2 className="h-5 w-5" />
                            </button>
                        )}

                        <div className="text-center w-full max-w-md">
                            {error && (
                                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-left border border-red-200">
                                    {error}
                                </div>
                            )}

                            {!isEditing ? (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{userData?.username || currentUser?.displayName || 'User'}</h2>
                                        <p className="text-sm text-gray-500 flex items-center justify-center mt-1">
                                            <Mail className="h-4 w-4 mr-1" /> {currentUser?.email}
                                        </p>
                                    </div>

                                    <div className="bg-orange-50/50 rounded-2xl p-6 text-left border border-orange-100 shadow-sm space-y-5">
                                        <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-2">Delivery Intelligence</h3>

                                        <div className="flex items-start">
                                            <div className="bg-white p-2 rounded-xl shadow-sm mr-4">
                                                <Building2 className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 leading-tight">
                                                    {userData?.building_name || 'Home/Office'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{userData?.full_address || userData?.address || 'No address provided'}</p>
                                            </div>
                                        </div>

                                        {userData?.landmark && (
                                            <div className="flex items-start">
                                                <div className="bg-white p-2 rounded-xl shadow-sm mr-4">
                                                    <Landmark className="h-5 w-5 text-orange-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">Near {userData?.landmark}</p>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-0.5">Verified Landmark</p>
                                                </div>
                                            </div>
                                        )}

                                        {userData?.delivery_instructions && (
                                            <div className="flex items-start">
                                                <div className="bg-white p-2 rounded-xl shadow-sm mr-4">
                                                    <NotebookText className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 italic">"{userData?.delivery_instructions}"</p>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-0.5">Instructions</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center py-4 px-4 border border-red-100 rounded-2xl text-red-600 bg-red-50 hover:bg-red-100 font-black transition-all shadow-sm active:scale-95"
                                    >
                                        <LogOut className="h-5 w-5 mr-2" /> Log Out
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in text-left">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Username</label>
                                        <div className="relative rounded-2xl shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-4 w-4 text-orange-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editUsername}
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-11 text-sm font-bold border-gray-100 bg-gray-50 rounded-2xl py-3.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 flex items-center gap-1">
                                            <Navigation className="h-3 w-3" /> Update Map Location
                                        </label>
                                        <SmartLocationPicker
                                            onLocationConfirmed={handleLocationConfirmed}
                                            initialCoords={userData?.latitude ? { lat: Number(userData.latitude), lng: Number(userData.longitude) } : null}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1 flex items-center gap-1">
                                            <NotebookText className="h-3 w-3" /> Delivery Instructions
                                        </label>
                                        <textarea
                                            value={editInstructions}
                                            onChange={(e) => setEditInstructions(e.target.value)}
                                            className="focus:ring-orange-500 focus:border-orange-500 block w-full px-4 py-3 text-sm font-bold border-gray-100 bg-gray-50 rounded-2xl transition-all"
                                            placeholder="Apt/Flat No, Landmarks, etc."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setError('');
                                                setEditUsername(userData?.username || currentUser?.displayName || '');
                                                setEditInstructions(userData?.delivery_instructions || '');
                                            }}
                                            className="flex-1 flex justify-center py-4 px-4 rounded-2xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-black transition-all shadow-sm active:scale-95"
                                        >
                                            <X className="h-5 w-5 mr-1" /> Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-[2] flex justify-center py-4 px-4 rounded-2xl text-white bg-gray-900 hover:bg-orange-600 font-black transition-all disabled:opacity-50 active:scale-95 shadow-xl flex items-center gap-2"
                                        >
                                            {saving ? (
                                                <Loader className="animate-spin h-5 w-5" />
                                            ) : (
                                                <><Check className="h-5 w-5" /> Save Profile</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
