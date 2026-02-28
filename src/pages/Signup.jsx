import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader, User, MapPin, Building2, ArrowRight } from 'lucide-react';

export default function Signup() {
    const [step, setStep] = useState(1);

    // Step 1 fields
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('Kakinada');

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

    const handleNextStep = (e) => {
        e.preventDefault();

        if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('Username must be at least 3 characters and contain only letters, numbers, or underscores.');
            triggerValidationShake();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            triggerValidationShake();
            return;
        }

        if (address.trim() === '') {
            setError('Address is required.');
            triggerValidationShake();
            return;
        }

        if (city.trim().toLowerCase() !== 'kakinada') {
            setError('The app currently supports only the Kakinada region.');
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
            await signup(email, password, username, address, city);
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
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border shadow-sm transition-colors"
                                        placeholder="johndoe123"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border shadow-sm transition-colors"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                    Complete Delivery Address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        required
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border shadow-sm transition-colors"
                                        placeholder="123 Main St, Apt 4"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                    City
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        required
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border shadow-sm transition-colors"
                                        placeholder="Kakinada"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-orange-500 font-medium">Currently serving only Kakinada region.</p>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all active:scale-95"
                                >
                                    Continue <ArrowRight className="ml-2 h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">
                                    Email (Auto-filled)
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm opacity-70">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="bg-gray-100 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Set Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border shadow-sm transition-colors"
                                        placeholder="Minimum 6 characters, letters & numbers"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <input
                                        id="confirm-password"
                                        name="confirm-password"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border shadow-sm transition-colors"
                                        placeholder="Confirm your password"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 flex justify-center py-3 px-4 border border-orange-200 text-orange-600 rounded-xl shadow-sm text-sm font-bold bg-orange-50 hover:bg-orange-100 focus:outline-none transition-all active:scale-95"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Create Account'}
                                </button>
                            </div>
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
