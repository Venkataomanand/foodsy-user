import { ArrowRight, Search, Star, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

import deliveryPerson from '../assets/delivery_person.png';

export default function Hero() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const taglines = [
        "Delicious food delivered fresh, at prices you'll love!",
        "Craving something special? We've got you covered.",
        "Your favorite meals, delivered from our kitchen to yours.",
        "Affordable combos, premium taste, lightning fast delivery."
    ];

    const [taglineIndex, setTaglineIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTaglineIndex((prev) => (prev + 1) % taglines.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [taglines.length]);

    return (
        <div className="relative h-[450px] md:h-[550px] flex items-center justify-center overflow-hidden">
            {/* Dark background image with overlay */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1567337710282-00832b415979?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"></div>
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
                        Foodsy
                    </h1>
                    <div className="h-20 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={taglineIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="text-xl md:text-3xl text-white/90 font-medium italic"
                            >
                                {taglines[taglineIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col md:flex-row items-center bg-white rounded-xl md:rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto overflow-hidden ring-4 ring-white/20"
                    >
                        <div className="flex-grow flex items-center px-4 py-3 w-full border-b md:border-b-0 md:border-r border-gray-100">
                            <Search className="h-6 w-6 text-primary mr-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for restaurant, cuisine or a dish"
                                className="w-full focus:outline-none text-lg text-gray-800"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-lg md:rounded-xl font-black text-lg hover:bg-primary/90 transition-all shadow-lg active:scale-95"
                        >
                            Search
                        </button>
                    </form>

                    <div className="mt-8 flex justify-center space-x-6 text-white/80 font-bold">
                        <span className="flex items-center"><Star className="h-5 w-5 text-yellow-400 mr-2" /> 4.5+ Rated</span>
                        <span className="flex items-center"><Clock className="h-5 w-5 text-green-400 mr-2" /> 30 Min Delivery</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
