import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader, User, Navigation, ArrowRight, CheckCircle, NotebookText } from 'lucide-react';
import SmartLocationPicker from '../components/SmartLocationPicker';

export default function Signup() {
    const [step, setStep] = useState(1);

    // Step 1 fields
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [locationData, setLocationData] = useState(null);
    const [deliveryInstructions, setDeliveryInstructions] = useState('');

    // Step 2 fields
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const triggerValidationShake = () => {
        setShake(true);
        if (navigator.vibrate) {
            navigator.vibrate(200); // Haptic feedback
        }
        setTimeout(() => setShake(false), 500);
    };

    const handleLocationConfirmed = (data) => {
        setLocationData(data);
        setError('');
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const handleNextStep = (e) => {
        e.preventDefault();

        if (username.length < 3) {
            setError('Username must be at least 3 characters.');
            triggerValidationShake();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            triggerValidationShake();
            return;
        }

        if (!locationData) {
            setError('Please confirm your precise delivery location on the map.');
            triggerValidationShake();
            return;
        }

        setError('');
        setStep(2);
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (password.length < 6 || !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
            setError('Password must be at least 6 characters and contain letters and numbers.');
            triggerValidationShake();
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            triggerValidationShake();
            return;
        }

        try {
            setError('');
            setLoading(true);
            const userFullLocation = {
                ...locationData,
                delivery_instructions: deliveryInstructions
            };
            await signup(email, password, username, userFullLocation);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Success haptics
            navigate('/');
        } catch (err) {
            setError('Failed to create an account. ' + err.message);
            triggerValidationShake();
            console.error(err);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-[Poppins]">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-orange-600">
                    {step === 1 ? 'Create Account' : 'Set Password'}
                </h2>
                {step === 1 && (
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-orange-500 hover:text-orange-400">
                            Sign in
                        </Link>
                    </p>
                )}
            </div>

            <div className={`mt-8 sm:mx-auto sm:w-full sm:max-w-md transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}>
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-orange-100">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 ? (
                        <form className="space-y-6" onSubmit={handleNextStep}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="username" className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">
                                        Username
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 text-orange-400" />
                                        </div>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-11 py-3 text-sm font-bold border-gray-100 bg-gray-50 rounded-2xl transition-all"
                                            placeholder="johndoe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-orange-400" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-11 py-3 text-sm font-bold border-gray-100 bg-gray-50 rounded-2xl transition-all"
                                            placeholder="you@email.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 flex items-center gap-1">
                                    <Navigation className="h-3 w-3" /> Pin Your Delivery Location
                                </label>
                                <SmartLocationPicker onLocationConfirmed={handleLocationConfirmed} />
                            </div>

                            <div>
                                <label htmlFor="instructions" className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1 flex items-center gap-1">
                                    <NotebookText className="h-3 w-3" /> Flat / House No / Instructions
                                </label>
                                <textarea
                                    id="instructions"
                                    value={deliveryInstructions}
                                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                                    className="focus:ring-orange-500 focus:border-orange-500 block w-full px-4 py-3 text-sm font-bold border-gray-100 bg-gray-50 rounded-2xl transition-all"
                                    placeholder="e.g. Flat 402, Near Water Tank, Call on arrival"
                                    rows={2}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="group w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-gray-900 hover:bg-orange-600 transition-all active:scale-95 items-center gap-2"
                                >
                                    Proceed to Security <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">Step 1 of 2: Location Profile</p>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">
                                    Email (Confirming)
                                </label>
                                <div className="mt-1 relative rounded-2xl shadow-sm opacity-60">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="bg-gray-100 block w-full pl-11 text-sm font-bold rounded-2xl py-3.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">
                                    Create Password
                                </label>
                                <div className="mt-1 relative rounded-2xl shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-orange-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-11 text-sm font-bold border-gray-100 bg-gray-50 rounded-2xl py-3.5"
                                        placeholder="Min. 6 chars (A-z, 0-9)"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">
                                    Repeat Password
                                </label>
                                <div className="mt-1 relative rounded-2xl shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-orange-400" />
                                    </div>
                                    <input
                                        id="confirm-password"
                                        name="confirm-password"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-11 text-sm font-bold border-gray-100 bg-gray-50 rounded-2xl py-3.5"
                                        placeholder="Confirm security password"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 flex justify-center py-4 px-4 rounded-2xl text-gray-600 bg-gray-50 hover:bg-gray-100 font-black transition-all active:scale-95"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-gray-900 hover:bg-orange-600 focus:outline-none transition-all active:scale-95"
                                >
                                    {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Set Secure Password'}
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest leading-none">Step 2 of 2: Account Security</p>
                        </form>
                    )}
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
