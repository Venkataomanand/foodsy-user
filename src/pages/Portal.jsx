import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, ShieldCheck, ShoppingBag, Settings, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.jpg';

export default function Portal() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-orange-50/50 to-white">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <img src={logo} alt="Foodsy" className="h-24 w-auto mx-auto rounded-3xl shadow-xl mb-6 ring-4 ring-white" />
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                    Welcome to <span className="text-primary">Foodsy</span>
                </h1>
                <p className="mt-4 text-gray-500 font-medium text-lg italic">Select your destination to get started</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* User Panel Link */}
                <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group"
                >
                    <Link to="/" className="block bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-primary transition-all duration-300 overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShoppingBag size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                <User size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Customer Panel</h2>
                            <p className="text-gray-500 font-medium mb-6">Browse delicious items, create lists, and order fresh food delivered fast.</p>

                            <div className="flex items-center text-primary font-black uppercase tracking-wider text-sm">
                                Enter Shop <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Admin Panel Link */}
                <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group"
                >
                    <Link to="/admin" className="block bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-primary transition-all duration-300 overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-white">
                            <Settings size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:bg-primary transition-colors duration-300">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">Admin Dashboard</h2>
                            <p className="text-gray-300/80 font-medium mb-6">Management suite for products, orders, and custom delivery lists.</p>

                            <div className="flex items-center text-primary font-black uppercase tracking-wider text-sm">
                                Login to Control <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 text-gray-400 text-sm font-bold flex items-center bg-gray-100/50 px-6 py-3 rounded-full"
            >
                <span className="mr-2">🚀</span> Powered by Foodsy Advanced Logistics
            </motion.div>
        </div>
    );
}
