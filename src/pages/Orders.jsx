import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import {
    Package, Truck, MapPin, CheckCircle, Clock,
    Banknote, ChefHat, ShoppingBag, Star, Receipt
} from 'lucide-react';

const STATUS_CONFIG = {
    'Confirmed': { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', step: 0 },
    'Placed': { label: 'Placed', color: 'bg-gray-100 text-gray-600', step: 0 },
    'Preparing': { label: 'Preparing', color: 'bg-orange-100 text-orange-700', step: 1 },
    'On the Way': { label: 'On the Way', color: 'bg-yellow-100 text-yellow-700', step: 2 },
    'Delivered': { label: 'Delivered', color: 'bg-green-100 text-green-700', step: 3 },
};

const STEPS = [
    { label: 'Confirmed', icon: Clock },
    { label: 'Preparing', icon: ChefHat },
    { label: 'On the Way', icon: Truck },
    { label: 'Delivered', icon: CheckCircle },
];

export default function Orders() {
    const { currentUser, userData } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        if (!currentUser) { setLoading(false); return; }

        // Query by BOTH the Firebase UID and the custom userId to catch all orders
        const uid = currentUser.uid;
        const email = currentUser.email;
        const customUserId = userData?.userId;

        // Build query — try uid first, fallback includes custom ID and email
        const constraints = [where('userId', '==', uid)];
        if (customUserId && customUserId !== uid) {
            constraints.push(where('userId', '==', customUserId));
        }

        // For existing orders saved with email as key
        const emailQuery = email ? where('email', '==', email) : null;

        // Use separate queries and merge
        const q1 = query(collection(db, 'orders'), where('userId', '==', uid));
        const results = new Map();

        const mergeAndSet = () => {
            const arr = Array.from(results.values());
            arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setOrders(arr);
            setLoading(false);
        };

        const unsub1 = onSnapshot(q1, snap => {
            snap.docs.forEach(doc => results.set(doc.id, { id: doc.id, ...doc.data() }));
            mergeAndSet();
        }, () => setLoading(false));

        let unsub2 = () => { };
        if (customUserId && customUserId !== uid) {
            const q2 = query(collection(db, 'orders'), where('userId', '==', customUserId));
            unsub2 = onSnapshot(q2, snap => {
                snap.docs.forEach(doc => results.set(doc.id, { id: doc.id, ...doc.data() }));
                mergeAndSet();
            }, () => { });
        }

        let unsub3 = () => { };
        if (email) {
            const q3 = query(collection(db, 'orders'), where('email', '==', email));
            unsub3 = onSnapshot(q3, snap => {
                snap.docs.forEach(doc => results.set(doc.id, { id: doc.id, ...doc.data() }));
                mergeAndSet();
            }, () => { });
        }

        return () => { unsub1(); unsub2(); unsub3(); };
    }, [currentUser, userData]);

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-gray-900 mb-2">Please Login</h2>
                    <p className="text-gray-500 mb-6">Sign in to view your order history.</p>
                    <Link to="/login" className="bg-primary text-white px-6 py-3 rounded-xl font-black hover:bg-primary/90 transition-all">Login</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center px-4">
                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">No Orders Yet</h2>
                    <p className="text-gray-500 mb-8 font-medium">Your delicious meals are just a tap away!</p>
                    <Link to="/products" className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        Browse Menu 🍽️
                    </Link>
                </div>
            </div>
        );
    }

    const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'Delivered');
    const delivered = orders.filter(o => o.status === 'Delivered');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">My Orders</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{orders.length} total orders</p>
                    </div>
                    <div className="bg-primary/10 px-4 py-2 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Total Spent</p>
                        <p className="text-lg font-black text-primary">₹{totalSpent.toFixed(0)}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-2">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-black text-gray-900">{orders.length}</p>
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mt-0.5">Orders</p>
                    </div>
                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 text-center">
                        <p className="text-2xl font-black text-orange-600">{activeOrders.length}</p>
                        <p className="text-[9px] font-black uppercase text-orange-400 tracking-widest mt-0.5">Active</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-100 text-center">
                        <p className="text-2xl font-black text-green-600">{delivered.length}</p>
                        <p className="text-[9px] font-black uppercase text-green-400 tracking-widest mt-0.5">Delivered</p>
                    </div>
                </div>

                {/* Active Orders First */}
                {activeOrders.length > 0 && (
                    <div className="mb-4">
                        <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            Active Orders
                        </p>
                        <div className="space-y-4">
                            {activeOrders.map(order => <OrderCard key={order.id} order={order} expanded={expandedOrder === order.id} onToggle={() => setExpandedOrder(prev => prev === order.id ? null : order.id)} />)}
                        </div>
                    </div>
                )}

                {/* Past Orders */}
                {delivered.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
                            <Receipt className="h-3 w-3" /> Order History
                        </p>
                        <div className="space-y-4">
                            {delivered.map(order => <OrderCard key={order.id} order={order} expanded={expandedOrder === order.id} onToggle={() => setExpandedOrder(prev => prev === order.id ? null : order.id)} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function OrderCard({ order, expanded, onToggle }) {
    const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG['Confirmed'];
    const currentStep = statusInfo.step;
    const isDelivered = order.status === 'Delivered';
    const items = order.cartItems || order.items || [];
    const address = order.address || order.formatted_address || order.full_address || '';
    const orderedAt = order.createdAt?.toDate ? order.createdAt.toDate() : null;

    return (
        <div className={`bg-white rounded-3xl border overflow-hidden shadow-sm transition-all duration-300 ${isDelivered ? 'border-gray-100' : 'border-orange-100 shadow-orange-100/50'}`}>
            {/* Order Header */}
            <button onClick={onToggle} className="w-full text-left">
                <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDelivered ? 'bg-green-100' : 'bg-orange-100'}`}>
                            {isDelivered ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Truck className="h-5 w-5 text-orange-600" />}
                        </div>
                        <div>
                            <p className="font-black text-gray-900 text-sm">{order.orderId || order.id}</p>
                            <p className="text-[10px] font-bold text-gray-400">
                                {orderedAt ? orderedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : `${order.date || ''} ${order.time || ''}`}
                            </p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="font-black text-gray-900">₹{(order.totalAmount || order.total || 0).toFixed(0)}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                </div>

                {/* Items Preview */}
                <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                    {items.slice(0, 3).map((item, i) => (
                        <span key={i} className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                            {item.name} × {item.quantity}
                        </span>
                    ))}
                    {items.length > 3 && (
                        <span className="text-[10px] font-bold text-primary">+{items.length - 3} more</span>
                    )}
                </div>
            </button>

            {/* Progress Tracker */}
            {!isDelivered && (
                <div className="px-6 pb-4">
                    <div className="relative flex justify-between items-center">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100" />
                        <div
                            className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-700"
                            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                        />
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const done = i <= currentStep;
                            const current = i === currentStep;
                            return (
                                <div key={s.label} className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-all ${done ? 'border-primary text-primary' : 'border-gray-200 text-gray-300'} ${current ? 'ring-4 ring-primary/20 shadow-lg' : ''}`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className={`mt-1.5 text-[8px] font-black uppercase tracking-wider ${done ? 'text-primary' : 'text-gray-300'}`}>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Expanded Section */}
            {expanded && (
                <div className="border-t border-gray-50 bg-gray-50/50 p-4 space-y-4">
                    {/* All Items */}
                    <div>
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">Items Ordered</p>
                        <div className="space-y-2">
                            {items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-white rounded-xl p-3 border border-gray-100">
                                    <div>
                                        <p className="font-black text-sm text-gray-900">{item.name}</p>
                                        {item.selectedOption && <p className="text-[10px] font-bold text-primary">{item.selectedOption}</p>}
                                        {item.restaurantName && <p className="text-[9px] text-gray-400 uppercase font-bold">@{item.restaurantName}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-500 text-sm">×{item.quantity}</p>
                                        <p className="text-xs font-bold text-gray-400">₹{((item.price || 0) * item.quantity).toFixed(0)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Bill Summary</p>
                        <div className="flex justify-between text-sm font-medium text-gray-600">
                            <span>Item Total</span>
                            <span>₹{(order.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium text-gray-600">
                            <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</span>
                            <span>₹{(order.deliveryFee || 0).toFixed(2)}</span>
                        </div>
                        {order.distance > 0 && (
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Distance</span>
                                <span>{Number(order.distance).toFixed(2)} km</span>
                            </div>
                        )}
                        <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-gray-900">
                            <span>Total Paid</span>
                            <span className="text-primary">₹{(order.totalAmount || order.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <Banknote className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs font-bold text-gray-500">{order.paymentMethod || 'Cash on Delivery'}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ml-auto ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {order.paymentStatus || 'Pending'}
                            </span>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    {address && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100">
                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Delivery Address
                            </p>
                            {order.building_name && <p className="font-black text-gray-900 text-sm">🏢 {order.building_name}</p>}
                            {(order.floor_number || order.gate_details) && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase">
                                    {order.floor_number ? `Floor: ${order.floor_number}` : ''}
                                    {order.gate_details ? ` • Gate: ${order.gate_details}` : ''}
                                </p>
                            )}
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">📍 {address}</p>
                            {order.landmark && <p className="text-[10px] font-black text-orange-600 italic mt-1">Near {order.landmark}</p>}
                            {(order.latitude && order.longitude) && (
                                <a
                                    href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="mt-2 flex items-center gap-2 text-blue-600 text-xs font-black hover:underline"
                                >
                                    🗺️ View on Google Maps
                                </a>
                            )}
                        </div>
                    )}

                    {/* Cooking request */}
                    {order.cookingRequest && (
                        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                            <p className="text-[9px] font-black uppercase text-orange-400 tracking-widest mb-1">Cooking Request</p>
                            <p className="text-sm font-bold text-orange-700 italic">"{order.cookingRequest}"</p>
                        </div>
                    )}

                    {isDelivered && (
                        <div className="flex items-center justify-center gap-2 py-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <p className="text-xs font-bold text-gray-500">Order delivered successfully!</p>
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
