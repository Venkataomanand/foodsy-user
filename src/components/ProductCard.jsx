import { Plus, Minus, Star, Clock, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function ProductCard({ product }) {
    const { addToCart, cartItems, updateQuantity } = useCart();
    const [showOptions, setShowOptions] = useState(false);

    const isCombo = product.category.toLowerCase() === 'combos';
    const isBeverageCombo = product.name.toLowerCase().includes('beverage');
    const isMilkshakeCombo = product.name.toLowerCase().includes('milkshake');
    const isFriedRice = product.name.toLowerCase().includes('fried rice');
    const isNoodles = product.name.toLowerCase().includes('noodles');
    const isManchuria = product.name.toLowerCase().includes('manchuria');
    const isChilliChicken = product.name.toLowerCase().includes('chilli chicken');

    const needsOptions = isBeverageCombo || isMilkshakeCombo || isFriedRice || isNoodles || isManchuria || isChilliChicken;

    const beverageOptions = ['Coke', 'Sprite', 'Thums Up'];
    const milkshakeOptions = ['Chocolate', 'Vanilla', 'Strawberry'];
    const portionOptions = ['Half', 'Full'];

    let options = [];
    if (isBeverageCombo) options = beverageOptions;
    else if (isMilkshakeCombo) options = milkshakeOptions;
    else if (isFriedRice || isNoodles || isManchuria || isChilliChicken) options = portionOptions;

    const optionLabel = (isFriedRice || isNoodles || isManchuria || isChilliChicken) ? 'Portion' : (isBeverageCombo ? 'Beverage' : 'Shake');

    // Get all variants of this product in cart
    const productVariants = cartItems.filter(item => item.id === product.id);
    const totalQuantity = productVariants.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddClick = () => {
        if (needsOptions) {
            setShowOptions(true);
        } else {
            addToCart(product);
        }
    };

    const handleOptionSelect = (opt) => {
        addToCart(product, 1, opt);
        setShowOptions(false);
    };

    const isAvailable = product.available !== false;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-transparent hover:border-gray-100 ${!isAvailable ? 'opacity-75 grayscale' : ''}`}
        >
            <div className="h-48 bg-gray-100 relative overflow-hidden">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-50 group-hover:scale-110 transition-transform duration-500">
                        {product.emoji || '🥘'}
                    </div>
                )}
                {isCombo && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm">
                        Best Value
                    </div>
                )}
                {!isAvailable && (
                    <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm z-20">
                        Out of Stock
                    </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1 shadow-sm">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-900">{product.rating || '4.2'}</span>
                </div>
            </div>

            <div className="p-4 relative">
                <AnimatePresence>
                    {showOptions && isAvailable && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute inset-0 z-10 bg-white p-4 flex flex-col justify-center"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-black text-gray-900 uppercase">Select {optionLabel}</h4>
                                <button onClick={() => setShowOptions(false)} className="text-xs text-gray-400 hover:text-gray-900 font-bold">CANCEL</button>
                            </div>
                            <div className="space-y-2">
                                {options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => handleOptionSelect(opt)}
                                        className="w-full flex justify-between items-center bg-gray-50 hover:bg-primary/10 p-3 rounded-xl transition-colors group/opt"
                                    >
                                        <span className="font-bold text-gray-700 group-hover/opt:text-primary">{opt}</span>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover/opt:text-primary" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                </div>

                <p className="text-xs text-gray-500 mb-2">{product.category}</p>

                <div className="flex items-center space-x-3 text-xs text-gray-500 mb-4">
                    <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>10-15 min</span>
                    </div>
                    <span>•</span>
                    <span className="font-bold text-gray-900">₹{product.price}</span>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8 leading-relaxed">
                    {product.description}
                </p>

                {!isAvailable ? (
                    <button
                        disabled
                        className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl font-bold cursor-not-allowed"
                    >
                        <span>Currently Unavailable</span>
                    </button>
                ) : totalQuantity > 0 && !needsOptions ? (
                    <div className="flex items-center justify-between bg-primary/10 rounded-xl p-1">
                        <button
                            onClick={() => updateQuantity(product.id, totalQuantity - 1)}
                            className="p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-all"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-black text-primary text-lg">{totalQuantity}</span>
                        <button
                            onClick={() => updateQuantity(product.id, totalQuantity + 1)}
                            className="p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-all"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {productVariants.length > 0 && needsOptions && (
                            <div className="pb-2 space-y-1">
                                {productVariants.map((variant, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-xs">
                                        <span className="font-bold text-gray-700">{variant.selectedOption}</span>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => updateQuantity(product.id, variant.quantity - 1, variant.selectedOption)} className="p-1 text-gray-400 hover:text-red-500"><Minus className="h-3 w-3" /></button>
                                            <span className="font-black text-gray-900">{variant.quantity}</span>
                                            <button onClick={() => updateQuantity(product.id, variant.quantity + 1, variant.selectedOption)} className="p-1 text-gray-400 hover:text-primary"><Plus className="h-3 w-3" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={handleAddClick}
                            className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-primary transition-all duration-300 font-bold shadow-sm active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span>{totalQuantity > 0 ? 'Add more' : 'Add to Cart'}</span>
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
