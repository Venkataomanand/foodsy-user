import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import CustomOrderModal from '../components/CustomOrderModal';

export default function Cart() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                <div className="bg-gray-100 p-6 rounded-full mb-6">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link
                    to="/products"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CustomOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Shopping Cart</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                <div className="lg:col-span-7">
                    <ul className="border-t border-b border-gray-200 divide-y divide-gray-200">
                        {cartItems.map((item) => (
                            <motion.li
                                layout
                                key={item.id}
                                className="flex py-6 sm:py-10"
                            >
                                <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center text-3xl">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{item.emoji}</span>
                                    )}
                                </div>

                                <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                                        <div>
                                            <div className="flex justify-between">
                                                <h3 className="text-sm">
                                                    <Link to={`/products`} className="font-medium text-gray-700 hover:text-gray-800">
                                                        {item.name}
                                                    </Link>
                                                </h3>
                                            </div>
                                            <p className="mt-1 text-sm font-medium text-gray-900">₹{item.price}</p>
                                            <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                                        </div>

                                        <div className="mt-4 sm:mt-0 sm:pr-9">
                                            <div className="flex items-center border border-gray-300 rounded-md w-max">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 hover:bg-gray-100 text-gray-600"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="px-4 py-1 text-gray-900 font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:bg-gray-100 text-gray-600"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="absolute top-0 right-0">
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="-m-2 p-2 inline-flex text-gray-400 hover:text-red-500"
                                                >
                                                    <span className="sr-only">Remove</span>
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </div>

                {/* Order Summary */}
                <section className="mt-16 bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5">
                    <h2 className="text-lg font-medium text-gray-900">Order summary</h2>

                    <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Subtotal</p>
                            <p className="text-sm font-medium text-gray-900">₹{cartTotal.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Shipping estimate</p>
                            <p className="text-sm font-medium text-gray-900">₹5.00</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                            <p className="text-base font-medium text-gray-900">Order total</p>
                            <p className="text-base font-medium text-gray-900">₹{(cartTotal + 5).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link
                            to="/checkout"
                            className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        >
                            Checkout <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>

                    {/* WhatsApp Feature */}
                    <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-100">
                        <h3 className="text-sm font-bold text-green-900 flex items-center">
                            <span className="mr-2">📲</span> Can't find an item?
                        </h3>
                        <p className="text-xs text-green-700 mt-1 mb-4">
                            Send us a custom list of items you want, and we'll deliver them to you!
                        </p>
                        <button
                            onClick={async () => {
                                const list = prompt("Enter the items you want (comma separated):");
                                if (!list) return;

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

                                    alert("List submitted successfully! Redirecting to WhatsApp...");

                                    // 2. Open WhatsApp
                                    const message = `hai foodsy! I have submitted this list on the website: ${list}`;
                                    window.open(`https://wa.me/918143938358?text=${encodeURIComponent(message)}`, '_blank');
                                } catch (error) {
                                    console.error("Error submitting list:", error);
                                    alert("Opening WhatsApp...");
                                    const message = `hai foodsy! I want to order these items which are not in the cart: ${list}`;
                                    window.open(`https://wa.me/918143938358?text=${encodeURIComponent(message)}`, '_blank');
                                }
                            }}
                            className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
                        >
                            Send List via WhatsApp
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
