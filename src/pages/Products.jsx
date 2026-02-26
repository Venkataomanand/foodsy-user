import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import RestaurantCard from '../components/RestaurantCard';
import { Filter, Loader, Building, MapPin, Star, Clock } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import CustomOrderModal from '../components/CustomOrderModal';
import { motion } from 'framer-motion';
const CATEGORY_STRUCTURE = {
    'Food': ['Biryanis', 'Tiffins', 'Pulavs', 'Desserts', 'Milkshakes', 'Beverages'],
    'Vegetables': ['Fruits', 'Green Leafy Vegetables', 'Vegetables'],
    'Grocery': ['Rice & Dals', 'Oils & Spices', 'Snacks & Drinks', 'Essentials'],
    'Combos': []
};

const MAIN_CATEGORIES = ['All', 'Food', 'Vegetables', 'Grocery', 'Combos'];

// Helper to determine parent category
const getParentCategory = (subCat) => {
    for (const [parent, subs] of Object.entries(CATEGORY_STRUCTURE)) {
        if (subs.includes(subCat) || parent === subCat) return parent;
    }
    return 'All';
};

export default function Products() {
    const { products, restaurants, loading } = useProduct();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const searchQuery = searchParams.get('search') || '';
    const restaurantId = searchParams.get('restaurant');

    // States for hierarchical filtering
    const [activeMainCategory, setActiveMainCategory] = useState('All');
    const [activeSubCategory, setActiveSubCategory] = useState(null);

    useEffect(() => {
        if (categoryFilter) {
            const raw = categoryFilter.toLowerCase();
            // Find which subcategory this actually matches (case insensitive)
            let foundSub = null;
            let foundMain = null;

            // Check if it's a main category
            const matchMain = MAIN_CATEGORIES.find(m => m.toLowerCase() === raw);
            if (matchMain && matchMain !== 'All') {
                foundMain = matchMain;
                foundSub = null;
            } else {
                // Check if it's a sub category
                for (const [main, subs] of Object.entries(CATEGORY_STRUCTURE)) {
                    const matchSub = subs.find(s => s.toLowerCase() === raw);
                    if (matchSub) {
                        foundMain = main;
                        foundSub = matchSub;
                        break;
                    }
                }
            }

            setActiveMainCategory(foundMain || 'All');
            setActiveSubCategory(foundSub);
        } else if (!searchQuery) {
            setActiveMainCategory('All');
            setActiveSubCategory(null);
        }
    }, [categoryFilter, searchQuery]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader className="animate-spin text-primary h-12 w-12" />
            </div>
        );
    }

    const filteredProducts = products.filter(product => {
        // 0. Filter by Restaurant (including on/off status)
        if (product.restaurantId) {
            const restaurant = restaurants.find(r => r.id === product.restaurantId);
            // Hide product if restaurant exists but is closed
            if (restaurant && restaurant.isOpen === false) return false;
            // Also enforce restaurant matching if specific restaurantId filtered
            if (restaurantId && product.restaurantId !== restaurantId) return false;
        } else if (restaurantId) {
            // If filtering by restaurant but product has none, hide it
            return false;
        }

        const productCat = product.category || '';
        const parentCat = getParentCategory(productCat);

        const productName = (product.name || '').toLowerCase();
        const productDesc = (product.description || '').toLowerCase();

        // 1. Filter by Main Category
        if (activeMainCategory !== 'All' && parentCat !== activeMainCategory) return false;

        // 2. Filter by Sub Category (if one is selected)
        if (activeSubCategory && productCat !== activeSubCategory) return false;

        // 3. Filter by Search Query
        const matchesSearch = productName.includes(searchQuery.toLowerCase()) ||
            productDesc.includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const handleMainCategoryClick = (cat) => {
        setActiveMainCategory(cat);
        setActiveSubCategory(null);
        searchParams.delete('search');
        if (cat === 'All') searchParams.delete('category');
        else searchParams.set('category', cat.toLowerCase());
        setSearchParams(searchParams);
    };

    const handleSubCategoryClick = (sub) => {
        setActiveSubCategory(sub);
        searchParams.delete('search');
        searchParams.set('category', sub.toLowerCase());
        setSearchParams(searchParams);
    };

    const currentRestaurant = restaurantId ? restaurants.find(r => r.id === restaurantId) : null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CustomOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Restaurant Profile Header */}
            {currentRestaurant && (
                <div className="mb-12 bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 flex flex-col md:flex-row">
                    <div className="h-48 md:h-auto md:w-1/3 relative overflow-hidden">
                        <img
                            src={currentRestaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80'}
                            alt={currentRestaurant.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                            Featured
                        </div>
                    </div>
                    <div className="p-8 md:w-2/3 flex flex-col justify-center">
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-1">{currentRestaurant.name}</h1>
                        <p className="text-gray-400 font-bold mb-6 text-sm">{currentRestaurant.cuisine || 'North Indian • Biryani • Chinese'}</p>
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-green-200">
                                <Star className="h-4 w-4 fill-white" />
                                <span className="font-black">{currentRestaurant.rating || '4.5'}</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-50 text-gray-600 px-4 py-2 rounded-2xl border border-gray-100">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-black text-sm">{currentRestaurant.deliveryTime || '30-40 min'}</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-50 text-gray-600 px-4 py-2 rounded-2xl border border-gray-100">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="font-black text-sm">JNTUK, Kakinada</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col space-y-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary decoration-primary underline-offset-8">Our Menu</h1>
                        {searchQuery && (
                            <p className="text-gray-500 mt-1">
                                Results for "<span className="font-semibold text-gray-900">{searchQuery}</span>"
                                <button onClick={() => { searchParams.delete('search'); setSearchParams(searchParams); }} className="ml-2 text-sm text-red-500 hover:underline">Clear</button>
                            </p>
                        )}
                    </div>
                </div>

                {/* Main Category Row */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        <Filter className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                        {MAIN_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleMainCategoryClick(cat)}
                                className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all whitespace-nowrap shadow-sm ${activeMainCategory === cat
                                    ? 'bg-primary text-white shadow-primary/25 scale-105'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 hover:border-primary/20'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sub Category Row (Only shown if a main category with subs is active) */}
                    {activeMainCategory !== 'All' && CATEGORY_STRUCTURE[activeMainCategory]?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide bg-gray-50/50 p-2 rounded-2xl border border-gray-100/50"
                        >
                            <button
                                onClick={() => handleSubCategoryClick(null)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${!activeSubCategory
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-400 hover:text-gray-900'
                                    }`}
                            >
                                All {activeMainCategory}
                            </button>
                            {CATEGORY_STRUCTURE[activeMainCategory].map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => handleSubCategoryClick(sub)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeSubCategory === sub
                                        ? 'bg-primary text-white'
                                        : 'bg-white text-gray-400 hover:text-gray-900 hover:bg-white'
                                        }`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Restaurants Strip — shown when browsing Food or All, no restaurant selected */}
            {!restaurantId && (activeMainCategory === 'Food' || activeMainCategory === 'All') && restaurants.filter(r => r.isOpen !== false).length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Building className="h-6 w-6 text-primary" />
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none">Restaurants</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Browse by restaurant</p>
                        </div>
                    </div>
                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide gap-5">
                        {restaurants.filter(r => r.isOpen !== false).map(res => (
                            <RestaurantCard key={res.id} restaurant={res} />
                        ))}
                    </div>
                    <div className="mt-6 border-t border-gray-100" />
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg font-medium">No products found for your selection.</p>
                </div>
            )}

            {/* WhatsApp Custom List Feature */}
            <div className="mt-12 bg-green-50 rounded-2xl p-8 border border-green-100 shadow-sm text-center">
                <h3 className="text-2xl font-black text-green-900 mb-2">Can't find what you're looking for? 📲</h3>
                <p className="text-green-700 font-medium mb-6 italic">Don't worry! Just send us your custom list of items, and we'll deliver them for you.</p>
                <button
                    onClick={async () => {
                        const list = prompt("What else would you like to order? (e.g., specific brand of milk, custom meal, etc.)");
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

                            alert("List submitted successfully! Redirecting to WhatsApp...");
                            const message = `hai foodsy! I have submitted this list on the website: ${list}`;
                            window.open(`https://wa.me/918143938358?text=${encodeURIComponent(message)}`, '_blank');
                        } catch (error) {
                            console.error("Error submitting list:", error);
                            alert("Opening WhatsApp...");
                            const message = `hai foodsy! I want to order these items which are not in the list: ${list}`;
                            window.open(`https://wa.me/918143938358?text=${encodeURIComponent(message)}`, '_blank');
                        }
                    }}
                    className="bg-green-600 text-white px-10 py-4 rounded-xl font-black hover:bg-green-700 transition-all shadow-lg active:scale-95"
                >
                    Order via WhatsApp List
                </button>
            </div>
        </div>
    );
}
