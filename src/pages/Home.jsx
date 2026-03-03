import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import RestaurantCard from '../components/RestaurantCard';
import { useNavigate, Link } from 'react-router-dom';
import { Tag, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useProduct } from '../context/ProductContext';
import CustomOrderModal from '../components/CustomOrderModal';

const CATEGORY_GROUPS = [
    {
        title: "Delicious Food",
        subtitle: "Tiffins, Desserts & more",
        items: [
            { name: 'Tiffins', icon: '🥗', color: 'bg-lime-50', link: '/products?category=tiffins' },
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
    const { storeOpen, restaurants } = useProduct();
    const [offers, setOffers] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

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
        <div className="space-y-12 pb-20">
            <Hero />

            {/* Global Store Closed Banner */}
            {storeOpen === false && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                    <div className="bg-red-50 border-2 border-red-100 rounded-[3xl] p-6 flex flex-col md:flex-row items-center gap-4 shadow-xl shadow-red-100/20 text-center md:text-left">
                        <div className="bg-red-500 p-3 rounded-2xl text-white shadow-lg flex-shrink-0">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-red-900 leading-tight">Store is Currently Offline</h2>
                            <p className="text-red-700 font-extrabold text-lg mt-1 animate-pulse tracking-wide">
                                🚀 MARCH 5TH LAUNCH AT 9:09AM
                            </p>
                            <p className="text-red-600 font-bold text-sm mt-1">We are not accepting orders right now. Prepare for our grand update!</p>
                        </div>
                    </div>
                </div>
            )}


            {/* Offers for you section */}
            {offers.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                    <div className="flex items-center space-x-2 mb-6">
                        <Tag className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-black text-gray-900">Best Offers for you</h2>
                    </div>
                    <div className="flex overflow-x-auto pb-6 scrollbar-hide space-x-6">
                        {offers.map((offer) => (
                            <div
                                key={offer.id}
                                className="flex-shrink-0 w-[280px] md:w-[350px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white relative overflow-hidden group shadow-xl shadow-gray-200"
                            >
                                <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12 transition-transform group-hover:scale-110">
                                    {offer.emoji || '🔥'}
                                </div>
                                <div className="relative z-10">
                                    <div className="text-primary font-black text-sm uppercase tracking-wider mb-2">Exclusive Offer</div>
                                    <h3 className="text-2xl font-black mb-2 leading-tight">{offer.title}</h3>
                                    <p className="text-gray-400 text-sm font-medium mb-4">{offer.description}</p>
                                    {offer.code && (
                                        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 group/code cursor-pointer hover:bg-white/20 transition-all">
                                            <span className="text-[10px] font-black uppercase text-gray-400">Code:</span>
                                            <span className="text-sm font-black text-primary tracking-widest">{offer.code}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Restaurants Section (Replacing old Food Categories) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 leading-tight">Popular Restaurants</h2>
                        <p className="text-gray-500 font-medium italic mt-1">Order from the best kitchens in town</p>
                    </div>
                    <Link to="/products?category=food" className="text-primary font-bold text-sm hover:underline italic bg-primary/5 px-4 py-2 rounded-xl">View All Restaurants</Link>
                </div>

                <div className="flex overflow-x-auto pb-8 scrollbar-hide space-x-6 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {restaurants.map(res => (
                        <div key={res.id} className="flex-shrink-0 w-[280px] md:w-[320px] transform hover:scale-[1.02] transition-all">
                            <RestaurantCard restaurant={res} />
                        </div>
                    ))}
                    {restaurants.length === 0 && (
                        <div className="w-full py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                            <p className="text-gray-400 font-medium">No restaurants found yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Vegetables Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900">Fresh Vegetables</h2>
                    <Link to="/products?category=vegetables" className="text-primary font-bold text-sm hover:underline italic">View All Veggies</Link>
                </div>
                <div className="flex overflow-x-auto pb-4 scrollbar-hide space-x-6">
                    {CATEGORY_GROUPS[1].items.map((cat) => (
                        <Link key={cat.name} to={cat.link} className="flex-shrink-0 flex flex-col items-center group">
                            <div className={`w-20 h-20 md:w-24 md:h-24 ${cat.color} rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300`}>
                                {cat.icon}
                            </div>
                            <span className="mt-3 text-xs md:text-sm font-bold text-gray-700 group-hover:text-primary transition-colors text-center">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Grocery Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900">Daily Grocery</h2>
                    <Link to="/products?category=grocery" className="text-primary font-bold text-sm hover:underline italic">View All Grocery</Link>
                </div>
                <div className="flex overflow-x-auto pb-4 scrollbar-hide space-x-6">
                    {CATEGORY_GROUPS[2].items.map((cat) => (
                        <Link key={cat.name} to={cat.link} className="flex-shrink-0 flex flex-col items-center group">
                            <div className={`w-20 h-20 md:w-24 md:h-24 ${cat.color} rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300`}>
                                {cat.icon}
                            </div>
                            <span className="mt-3 text-xs md:text-sm font-bold text-gray-700 group-hover:text-primary transition-colors text-center">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

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


        </div>
    );
}
