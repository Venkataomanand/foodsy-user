import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Filter, Loader } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import CustomOrderModal from '../components/CustomOrderModal';

const CATEGORY_MAP = {
    'All': [],
    'Food': ['Fastfood', 'Soups', 'Maggies', 'Juices', 'Soft drinks'],
    'Vegetables': [],
    'Grocery': [],
    'Combos': []
};

export default function Products() {
    const { products, loading } = useProduct();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const subCategoryFilter = searchParams.get('subcategory');
    const searchQuery = searchParams.get('search') || '';

    const [activeCategory, setActiveCategory] = useState(categoryFilter || 'All');
    const [activeSubCategory, setActiveSubCategory] = useState(subCategoryFilter || 'All');

    useEffect(() => {
        if (categoryFilter) {
            const standardized = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1).toLowerCase();
            setActiveCategory(standardized);
        } else if (!searchQuery) {
            setActiveCategory('All');
        }

        if (subCategoryFilter) {
            setActiveSubCategory(subCategoryFilter);
        } else {
            setActiveSubCategory('All');
        }
    }, [categoryFilter, subCategoryFilter, searchQuery]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader className="animate-spin text-primary h-12 w-12" />
            </div>
        );
    }

    const filteredProducts = products.filter(product => {
        const productCat = product.category;

        let matchesCategory = false;
        if (activeCategory === 'All') {
            matchesCategory = true;
        } else if (activeCategory === 'Food') {
            // If main category is Food, matches if it's one of the subcategories OR literally 'Food'
            matchesCategory = CATEGORY_MAP['Food'].includes(productCat) || productCat === 'Food';

            // Further filter by subcategory if one is selected
            if (activeSubCategory !== 'All') {
                matchesCategory = productCat === activeSubCategory;
            }
        } else {
            matchesCategory = productCat === activeCategory;
        }

        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    const mainCategories = Object.keys(CATEGORY_MAP);
    const subCategories = activeCategory === 'Food' ? ['All', ...CATEGORY_MAP['Food']] : [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CustomOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <div className="flex flex-col space-y-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary">Our Menu</h1>
                        {searchQuery && (
                            <p className="text-gray-500 mt-1">
                                Results for "<span className="font-semibold text-gray-900">{searchQuery}</span>"
                                <button
                                    onClick={() => {
                                        searchParams.delete('search');
                                        setSearchParams(searchParams);
                                    }}
                                    className="ml-2 text-sm text-red-500 hover:underline"
                                >
                                    Clear
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                {/* Main Categories */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-gray-100">
                    <Filter className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                    {mainCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setActiveCategory(cat);
                                setActiveSubCategory('All');
                                searchParams.delete('search');
                                searchParams.delete('subcategory');
                                if (cat === 'All') searchParams.delete('category');
                                else searchParams.set('category', cat.toLowerCase());
                                setSearchParams(searchParams);
                            }}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${activeCategory === cat
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Sub Categories for Food */}
                {subCategories.length > 0 && (
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="w-8 h-8 flex items-center justify-center text-primary/50 flex-shrink-0">
                            <ChevronRight className="h-4 w-4" />
                        </div>
                        {subCategories.map(sub => (
                            <button
                                key={sub}
                                onClick={() => {
                                    setActiveSubCategory(sub);
                                    if (sub === 'All') searchParams.delete('subcategory');
                                    else searchParams.set('subcategory', sub);
                                    setSearchParams(searchParams);
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex-shrink-0 ${activeSubCategory === sub
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                )}
            </div>

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
