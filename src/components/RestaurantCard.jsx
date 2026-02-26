import { Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RestaurantCard({ restaurant }) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => restaurant.isOpen !== false && navigate(`/products?restaurant=${restaurant.id}`)}
            className={`flex-shrink-0 w-[280px] md:w-[320px] group cursor-pointer ${restaurant.isOpen === false ? 'grayscale opacity-75 cursor-not-allowed' : ''}`}
        >
            <div className="relative h-48 rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 mb-4 transition-transform group-hover:scale-[1.02] duration-500">
                <img
                    src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent p-4">
                    <div className="flex items-center justify-between">
                        <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg">Featured</span>
                        <div className="flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-black shadow-lg">
                            <Star className="h-3 w-3 fill-white" />
                            <span>{restaurant.rating || '4.5'}</span>
                        </div>
                    </div>
                </div>
                {restaurant.isOpen === false && (
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <span className="bg-red-600 text-white text-xs font-black px-4 py-2 rounded-2xl uppercase tracking-[0.2em] shadow-2xl transform -rotate-12 border-2 border-white/20">
                            Closed
                        </span>
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight mb-1">{restaurant.name}</h3>
                <p className="text-sm font-bold text-gray-400 line-clamp-1 mb-2 capitalize">{restaurant.cuisine || 'North Indian • Biryani • Chinese'}</p>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <span>{restaurant.deliveryTime || '30-40 min'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
