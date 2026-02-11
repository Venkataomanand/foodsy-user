import { Plus, Star, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();

    const isCombo = product.category.toLowerCase() === 'combos';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-transparent hover:border-gray-100"
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
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1 shadow-sm">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-900">{product.rating || '4.2'}</span>
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                </div>

                <p className="text-xs text-gray-500 mb-2">{product.category}</p>

                <div className="flex items-center space-x-3 text-xs text-gray-500 mb-4">
                    <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>30-35 min</span>
                    </div>
                    <span>•</span>
                    <span className="font-bold text-gray-900">₹{product.price}</span>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8 leading-relaxed">
                    {product.description}
                </p>

                <button
                    onClick={() => addToCart(product)}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-primary transition-all duration-300 font-bold shadow-sm active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add to Cart</span>
                </button>
            </div>
        </motion.div>
    );
}
