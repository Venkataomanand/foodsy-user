import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Menu, X, User, LogOut, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.jpg';

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const { cartItems } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    };

    return (
        <nav className="bg-primary shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center bg-white/90 p-1.5 rounded-lg shadow-sm hover:bg-white transition-colors">
                            <img src={logo} alt="Foodsy" className="h-10 w-auto" />
                        </Link>
                        <Link to="/short-videos" className="ml-2 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors" title="Watch Shorts">
                            <Play className="h-5 w-5 fill-current" />
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <button
                                onClick={() => window.open(`https://wa.me/918143938358?text=${encodeURIComponent('hai foodsy! I need some help with my order.')}`, '_blank')}
                                className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Help
                            </button>
                            <Link to="/" className="text-white hover:text-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                                Home
                            </Link>
                            <Link to="/products" className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                Menu
                            </Link>
                            <Link to="/orders" className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                Orders
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <Link to="/cart" className="p-2 text-white/90 hover:text-white relative">
                            <ShoppingBag className="h-6 w-6" />
                            {cartItems.length > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary transform translate-x-1/4 -translate-y-1/4 bg-white rounded-full">
                                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            )}
                        </Link>

                        <div className="hidden sm:ml-3 sm:flex items-center">
                            {currentUser ? (
                                <div className="flex items-center space-x-4">
                                    <Link to="/profile" className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold text-lg shadow-md hover:bg-white hover:scale-105 transition-all outline outline-2 outline-white/50 border border-orange-200">
                                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email?.charAt(0).toUpperCase()}
                                    </Link>
                                </div>
                            ) : (
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-primary bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                                    Log in
                                </Link>
                            )}
                        </div>

                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:outline-none"
                            >
                                {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sm:hidden bg-primary shadow-lg"
                >
                    <div className="pt-2 pb-3 space-y-1">
                        <button
                            onClick={() => window.open(`https://wa.me/918143938358?text=${encodeURIComponent('hai foodsy! I need some help with my order.')}`, '_blank')}
                            className="text-white/90 hover:bg-white/10 hover:text-white block w-full text-left pl-3 pr-4 py-2 text-base font-medium"
                        >
                            Help / Support
                        </button>
                        <Link to="/" className="bg-white/10 text-white block pl-3 pr-4 py-2 text-base font-medium">
                            Home
                        </Link>
                        <Link to="/products" className="text-white/90 hover:bg-white/10 hover:text-white block pl-3 pr-4 py-2 text-base font-medium">
                            Menu
                        </Link>
                        <Link to="/short-videos" className="text-white/90 hover:bg-white/10 hover:text-white block pl-3 pr-4 py-2 text-base font-medium flex items-center">
                            <Play className="h-4 w-4 mr-2" /> Video Shorts
                        </Link>
                        <Link to="/orders" className="text-white/90 hover:bg-white/10 hover:text-white block pl-3 pr-4 py-2 text-base font-medium">
                            Orders
                        </Link>
                        {currentUser && (
                            <>
                                <Link to="/profile" className="text-white/90 hover:bg-white/10 hover:text-white block pl-3 pr-4 py-2 text-base font-medium flex items-center">
                                    <User className="h-4 w-4 mr-2" /> Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left text-white/90 hover:bg-white/10 hover:text-white block pl-3 pr-4 py-2 text-base font-medium flex items-center text-red-100"
                                >
                                    <LogOut className="h-4 w-4 mr-2" /> Log out
                                </button>
                            </>
                        )}
                        {!currentUser && (
                            <Link to="/login" className="text-white/90 hover:bg-white/10 hover:text-white block pl-3 pr-4 py-2 text-base font-medium">
                                Log in
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}
        </nav>
    );
}
