import { useState } from 'react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import CustomOrderModal from '../components/CustomOrderModal';

const CATEGORY_GROUPS = [
    {
        title: "Delicious Food",
        subtitle: "Biryanis, Pulavs, Desserts & more",
        items: [
            { name: 'Biryanis', icon: '🍛', color: 'bg-orange-50', link: '/products?category=biryanis' },
            { name: 'Pulavs', icon: '🥘', color: 'bg-yellow-50', link: '/products?category=pulavs' },
            { name: 'Desserts', icon: '🍰', color: 'bg-pink-50', link: '/products?category=desserts' },
            { name: 'Milkshakes', icon: '🥤', color: 'bg-purple-50', link: '/products?category=milkshakes' },
            { name: 'Beverages', icon: '🍹', color: 'bg-cyan-50', link: '/products?category=beverages' },
        ]
    },
    {
        title: "Fresh Vegetables",
        subtitle: "Farm fresh fruits and greens",
        items: [
            { name: 'Fruits', icon: '🍎', color: 'bg-red-50', link: '/products?category=fruits' },
            { name: 'Leafy Veg', icon: '🥬', color: 'bg-emerald-50', link: '/products?category=green leafy vegetables' },
            { name: 'Vegetables', icon: '🥦', color: 'bg-green-50', link: '/products?category=vegetables' },
        ]
    },
    {
        title: "Daily Grocery",
        subtitle: "Essentials delivered to your door",
        items: [
            { name: 'Rice & Dals', icon: '🌾', color: 'bg-amber-50', link: '/products?category=rice & dals' },
            { name: 'Oils & Spices', icon: '🍯', color: 'bg-yellow-100', link: '/products?category=oils & spices' },
            { name: 'Snacks', icon: '🍟', color: 'bg-orange-100', link: '/products?category=snacks & drinks' },
            { name: 'Essentials', icon: '🥚', color: 'bg-blue-50', link: '/products?category=essentials' },
        ]
    },
    {
        title: "Special Deals",
        subtitle: "Save more with our combos",
        items: [
            { name: 'Combos', icon: '🎁', color: 'bg-indigo-50', link: '/products?category=combos' },
        ]
    }
];

export default function Home() {
    const { currentUser } = useAuth();

    const handleCustomOrder = async () => {
        const list = prompt("What do you want us to bring? (e.g. Milk, Eggs, Bread)");
        if (!list) return;

        try {
            await addDoc(collection(db, 'orders'), {
                email: currentUser?.email || 'guest@example.com',
                isCustom: true,
                customList: list,
                status: 'List Received',
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: serverTimestamp()
            });

            alert("List submitted successfully! Redirecting to WhatsApp for confirmation...");
            const message = `hai foodsy! I have submitted this list on the website: ${list}`;
            window.open(`https://wa.me/918143938358?text=${encodeURIComponent(message)}`, '_blank');
        } catch (error) {
            console.error("Error submitting list:", error);
            alert("Failed to submit list to database. Opening WhatsApp anyway...");
            const message = `hai foodsy! I want to order: ${list}`;
            window.open(`https://wa.me/918143938358?text=${encodeURIComponent(message)}`, '_blank');
        }
    };

    return (
        <div className="space-y-16 pb-20">
            <Hero />

            {/* Categorized Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                {CATEGORY_GROUPS.map((group) => (
                    <section key={group.title}>
                        <div className="mb-8">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{group.title}</h2>
                            <p className="text-gray-500 font-medium">{group.subtitle}</p>
                        </div>
                        <div className="flex overflow-x-auto pb-6 scrollbar-hide space-x-6 md:grid md:grid-cols-5 lg:grid-cols-6 md:space-x-0 md:gap-8">
                            {group.items.map((cat) => (
                                <Link
                                    key={cat.name}
                                    to={cat.link}
                                    className="flex-shrink-0 flex flex-col items-center group transition-transform hover:scale-110"
                                >
                                    <div className={`w-20 h-20 md:w-28 md:h-28 ${cat.color} rounded-full flex items-center justify-center text-4xl md:text-5xl shadow-sm group-hover:shadow-lg transition-all duration-300 ring-2 ring-transparent group-hover:ring-primary/20`}>
                                        {cat.icon}
                                    </div>
                                    <span className="mt-4 text-sm md:text-base font-bold text-gray-700 group-hover:text-primary transition-colors text-center">{cat.name}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* Custom List Banner - WhatsApp Feature */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                        <div>
                            <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">Special Service</span>
                            <h2 className="text-3xl md:text-5xl font-black mt-6 leading-tight">Can't find what you need?</h2>
                            <p className="text-white/90 mt-4 text-lg font-medium">Just send us a list on WhatsApp, and we'll deliver it to your doorstep!</p>
                            <button
                                onClick={handleCustomOrder}
                                className="mt-8 bg-white text-green-600 px-8 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all shadow-xl active:scale-95 flex items-center w-fit"
                            >
                                <span className="mr-2">📲</span> Send WhatsApp List
                            </button>
                        </div>
                        <div className="hidden md:block text-[150px] opacity-20 select-none pointer-events-none text-right">
                            📝
                        </div>
                    </div>
                    {/* Abstract circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            </section>

            {/* Featured Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">Authentic Biryani Combos</h2>
                        <p className="mt-1 text-gray-500 font-medium italic">Save more with our curated meals</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2">Combo 1</h3>
                            <p className="text-white/80 font-bold text-xl mb-6">Biryani + Beverage</p>
                            <p className="text-4xl font-black mb-8">₹249</p>
                            <Link to="/products?category=combos" className="bg-white text-orange-600 px-6 py-3 rounded-xl font-black hover:bg-orange-50 transition-colors">Order Now</Link>
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-9xl opacity-20 transform group-hover:scale-110 transition-transform duration-500 leading-none">🍱</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2">Combo 2</h3>
                            <p className="text-white/80 font-bold text-xl mb-6">Biryani + Milkshake</p>
                            <p className="text-4xl font-black mb-8">₹299</p>
                            <Link to="/products?category=combos" className="bg-white text-purple-600 px-6 py-3 rounded-xl font-black hover:bg-purple-50 transition-colors">Order Now</Link>
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-9xl opacity-20 transform group-hover:scale-110 transition-transform duration-500 leading-none">🎁</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
