import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ShoppingBag } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function CustomOrderModal({ isOpen, onClose }) {
    const { currentUser } = useAuth();
    const [list, setList] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!list.trim()) return;

        setLoading(true);
        try {
            // 1. Save to Firestore
            await addDoc(collection(db, 'orders'), {
                email: currentUser?.email || 'guest@example.com',
                isCustom: true,
                customList: list,
                status: 'List Received',
                date: new Date().toLocaleDateString(),
                createdAt: serverTimestamp()
            });

            // 2. Open WhatsApp
            const message = `hai foodsy! I have submitted this list on the website: ${list}`;
            window.open(`https://wa.me/918143938358?text=${encodeURIComponent(message)}`, '_blank');

            setList('');
            onClose();
        } catch (error) {
            console.error("Error submitting list:", error);
            alert("Database busy, opening WhatsApp directly...");
            const message = `hai foodsy! I want to order: ${list}`;
            window.open(`https://wa.me/918143938358?text=${encodeURIComponent(message)}`, '_blank');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                    >
                        <div className="bg-primary p-6 text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-black">Create Your List</h3>
                            </div>
                            <p className="text-white/80 text-sm">Tell us what you need, and we'll bring it to your door!</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Your Custom Items
                                </label>
                                <textarea
                                    required
                                    value={list}
                                    onChange={(e) => setList(e.target.value)}
                                    placeholder="e.g. 2L Milk, 1 Dozen Eggs, Brown Bread, 1kg Tomatoes..."
                                    className="w-full h-40 px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-primary focus:ring-0 resize-none text-gray-700 placeholder:text-gray-400 font-medium transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !list.trim()}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-primary-dark transition-all active:scale-[0.98] shadow-lg shadow-primary/30 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Submit & Open WhatsApp</span>
                                        <Send className="h-5 w-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400 font-medium">
                                This list will be sent to the admin and confirmed via WhatsApp.
                            </p>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
