import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Filter, Loader } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import CustomOrderModal from '../components/CustomOrderModal';


export default function Products() {
    const { products, loading } = useProduct();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const searchQuery = searchParams.get('search') || '';
    const [activeCategory, setActiveCategory] = useState(categoryFilter || 'All');

    useEffect(() => {
        if (categoryFilter) {
            const standardized = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1).toLowerCase();
            setActiveCategory(standardized);
        } else if (!searchQuery) {
            setActiveCategory('All');
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
        const productCat = (product.category || '').toLowerCase();
        const productName = (product.name || '').toLowerCase();
        const productDesc = (product.description || '').toLowerCase();
        const activeCatLower = activeCategory.toLowerCase();

        let matchesCategory = activeCategory === 'All';
        if (!matchesCategory) {
            if (activeCatLower === 'food') {
                matchesCategory = productCat === 'food' || productCat === 'fastfood';
            } else {
                matchesCategory = productCat === activeCatLower;
            }
        }

        const matchesSearch = productName.includes(searchQuery.toLowerCase()) ||
            productDesc.includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    const categories = ['All', 'Food', 'Soups', 'Maggies', 'Juices', 'Soft drinks', 'Vegetables', 'Grocery', 'Combos'];

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

                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    <Filter className="h-5 w-5 text-gray-500 mr-2" />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setActiveCategory(cat);
                                searchParams.delete('search'); // Clear search when changing category
                                if (cat === 'All') searchParams.delete('category');
                                else searchParams.set('category', cat.toLowerCase());
                                setSearchParams(searchParams);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
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
