import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Loader, User, Mail, MapPin, Building2, LogOut, Edit2, Check, X } from 'lucide-react';

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit form states
    const [editUsername, setEditUsername] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editCity, setEditCity] = useState('Palnadu');
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
                    setUserData(docSnap.data());
                    setEditUsername(docSnap.data().username || currentUser.displayName || '');
                    setEditAddress(docSnap.data().address || '');
                    setEditCity(docSnap.data().city || 'Palnadu');
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

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (editUsername.length < 3 || !/^[a-zA-Z0-9_]+$/.test(editUsername)) {
            setError('Username must be at least 3 characters and contain only letters, numbers, or underscores.');
            triggerValidationShake();
            return;
        }

        if (editAddress.trim() === '') {
            setError('Address cannot be empty.');
            triggerValidationShake();
            return;
        }

        if (editCity.trim().toLowerCase() !== 'palnadu') {
            setError('Currently serving only Palnadu region.');
            triggerValidationShake();
            return;
        }

        try {
            setError('');
            setSaving(true);

            // Update auth profile
            await updateProfile(currentUser, { displayName: editUsername });

            // Update firestore document
            await updateDoc(doc(db, 'users', currentUser.uid), {
                username: editUsername,
                address: editAddress,
                city: editCity
            });

            setUserData(prev => ({
                ...prev,
                username: editUsername,
                address: editAddress,
                city: editCity
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

                                    <div className="bg-orange-50/50 rounded-2xl p-6 text-left border border-orange-100 shadow-sm">
                                        <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4">Delivery Details</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-start">
                                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{userData?.address || 'No address provided'}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Street Address</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <Building2 className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{userData?.city || 'Palnadu'}</p>
                                                    <p className="text-xs text-gray-500 mt-1">City</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center py-3 px-4 border border-red-200 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-colors shadow-sm"
                                    >
                                        <LogOut className="h-5 w-5 mr-2" /> Log Out
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveProfile} className="space-y-5 animate-fade-in text-left">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Username</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-orange-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editUsername}
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border shadow-sm transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-500 font-medium">Email (Not Editable)</label>
                                        <div className="mt-1 relative rounded-md shadow-sm opacity-60">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                disabled
                                                value={currentUser.email}
                                                className="bg-gray-100 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Address</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MapPin className="h-5 w-5 text-orange-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editAddress}
                                                onChange={(e) => setEditAddress(e.target.value)}
                                                className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border shadow-sm transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Building2 className="h-5 w-5 text-orange-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editCity}
                                                onChange={(e) => setEditCity(e.target.value)}
                                                className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border shadow-sm transition-colors"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-orange-500 font-medium">Currently serving only Palnadu region.</p>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setError('');
                                                // Reset to initial values
                                                setEditUsername(userData?.username || currentUser?.displayName || '');
                                                setEditAddress(userData?.address || '');
                                                setEditCity(userData?.city || 'Palnadu');
                                            }}
                                            className="flex-1 flex justify-center py-2.5 px-4 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold transition-colors shadow-sm"
                                        >
                                            <X className="h-5 w-5 mr-1 -ml-1" /> Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-[2] flex justify-center py-2.5 px-4 rounded-xl text-white bg-orange-600 hover:bg-orange-700 font-bold transition-all disabled:opacity-50 active:scale-95 shadow-md flex items-center"
                                        >
                                            {saving ? (
                                                <Loader className="animate-spin h-5 w-5" />
                                            ) : (
                                                <><Check className="h-5 w-5 mr-1" /> Save Changes</>
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
