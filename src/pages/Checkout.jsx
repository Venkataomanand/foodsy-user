import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProduct } from '../context/ProductContext';
import { CheckCircle, Truck, Wallet, Banknote, CreditCard, MapPin } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';

export default function Checkout() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { currentUser, userData } = useAuth();
    const { restaurants } = useProduct();
    const navigate = useNavigate();

    // Enforce login
    useEffect(() => {
        if (!currentUser) {
            navigate('/login?redirect=checkout');
        }
    }, [currentUser, navigate]);

    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [formData, setFormData] = useState({
        phone: '',
        cookingRequest: ''
    });
    const [deliveryDistance, setDeliveryDistance] = useState(0);
    const [deliveryCharge, setDeliveryCharge] = useState(0);

    const AREAS = [
        { name: "Sarpavaram", distance: 3, lat: 16.985, lng: 82.250 },
        { name: "Ramanayapeta", distance: 2, lat: 16.965, lng: 82.253 },
        { name: "Gandhi Nagar", distance: 2, lat: 16.960, lng: 82.235 },
        { name: "Ashok Nagar", distance: 3, lat: 16.955, lng: 82.230 },
        { name: "Vidya Nagar", distance: 3, lat: 16.950, lng: 82.240 },
        { name: "Bank Colony", distance: 3, lat: 16.945, lng: 82.245 },
        { name: "Revenue Colony", distance: 3, lat: 16.940, lng: 82.250 },
        { name: "Teachers Colony", distance: 3, lat: 16.935, lng: 82.255 },
        { name: "G.P.T. Colony", distance: 4, lat: 16.930, lng: 82.260 },
        { name: "Maruti Nagar", distance: 4, lat: 16.925, lng: 82.265 },
        { name: "Lalitha Nagar", distance: 4, lat: 16.920, lng: 82.270 },
        { name: "Madura Nagar", distance: 4, lat: 16.915, lng: 82.275 },
        { name: "Santhi Nagar", distance: 4, lat: 16.910, lng: 82.280 },
        { name: "Rama Rao Peta", distance: 2, lat: 16.970, lng: 82.245 },
        { name: "Bhanugudi Junction", distance: 1, lat: 16.960, lng: 82.240 },
        { name: "Jagannaickpur", distance: 5, lat: 16.945, lng: 82.260 },
        { name: "Kacheripeta", distance: 5, lat: 16.940, lng: 82.265 },
        { name: "Vakalapudi", distance: 4.6, lat: 16.995, lng: 82.270 },
        { name: "Turangi", distance: 5, lat: 16.950, lng: 82.275 },
        { name: "Thimmapuram", distance: 8, lat: 17.010, lng: 82.280 },
        { name: "Rayudupalem", distance: 7, lat: 17.000, lng: 82.230 },
        { name: "Kovvada", distance: 8, lat: 17.020, lng: 82.220 },
        { name: "Balaji Cheruvu", distance: 2, lat: 16.975, lng: 82.240 },
        { name: "Beach Road", distance: 5, lat: 16.970, lng: 82.270 },
        { name: "Dummulapeta", distance: 5, lat: 16.965, lng: 82.275 },
        { name: "Nagamallithota", distance: 1, lat: 16.965, lng: 82.245 },
        { name: "JNTUK Area", distance: 0, lat: 16.974, lng: 82.242 }
    ].sort((a, b) => a.name.localeCompare(b.name));

    const VEG_HUB = {
        name: "Sapthagiri juice shop (Veg Hub)",
        address: "Ramanayyapeta, Boat Club",
        lat: 16.9680,
        lng: 82.2580
    };

    const calculateHaversine = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in KM
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Actual distance in KM (float)
    };

    const calculateDeliveryCharge = (dist) => {
        if (dist === 0) return 0;
        if (dist <= 1) return 20;
        // ₹20 for first km + ₹10 for every additional km
        const extraKm = Math.ceil(dist - 1);
        return 20 + (extraKm * 10);
    };

    useEffect(() => {
        if (userData) {
            // Determine if Veg Hub should be used
            const hasVeggie = cartItems.some(item =>
                ['Vegetables', 'Fruits', 'Green Leafy Vegetables'].includes(item.category)
            );

            // User Location
            const userLat = userData.latitude || (AREAS.find(a => userData.address?.includes(a.name))?.lat) || 16.974;
            const userLng = userData.longitude || (AREAS.find(a => userData.address?.includes(a.name))?.lng) || 82.242;

            // Source Location
            let sourceLat = 16.974; // Default to JNTUK Area
            let sourceLng = 82.242;

            if (hasVeggie) {
                sourceLat = VEG_HUB.lat;
                sourceLng = VEG_HUB.lng;
            } else if (cartItems.length > 0) {
                // Find the restaurant for the first item in cart
                const firstItemResId = cartItems[0].restaurantId;
                const activeRes = restaurants.find(r => r.id === firstItemResId);
                if (activeRes && activeRes.latitude && activeRes.longitude) {
                    sourceLat = activeRes.latitude;
                    sourceLng = activeRes.longitude;
                }
            }

            const dist = calculateHaversine(sourceLat, sourceLng, userLat, userLng);
            setDeliveryDistance(dist);

            // Rules: First 1 KM -> ₹15, After -> +₹10 each extra (rounded UP)
            const fee = calculateDeliveryCharge(dist);
            setDeliveryCharge(fee);
        }
    }, [userData, cartItems]);

    const handleAreaChange = (e) => {
        // Obsolete
    };

    const generateOrderId = async () => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const sequenceRef = doc(db, 'sequences', `orders_${dateStr}`);
        let seqNum = 1;
        try {
            await runTransaction(db, async (t) => {
                const docSnap = await t.get(sequenceRef);
                if (!docSnap.exists()) {
                    t.set(sequenceRef, { count: 1 });
                } else {
                    seqNum = docSnap.data().count + 1;
                    t.update(sequenceRef, { count: seqNum });
                }
            });
        } catch (e) {
            console.error("Sequence error:", e);
            seqNum = Math.floor(Math.random() * 999) + 1;
        }
        return `ORD-${dateStr}-${seqNum.toString().padStart(3, '0')}`;
    };

    async function handlePlaceOrder(e) {
        e.preventDefault();
        setLoading(true);

        if (!currentUser) {
            alert("Please login to place an order");
            navigate('/login');
            setLoading(false);
            return;
        }

        if (formData.phone.length !== 10) {
            alert("Please enter a valid 10-digit phone number");
            setLoading(false);
            return;
        }

        try {
            const email = currentUser.email;
            const newOrderId = await generateOrderId();
            const finalTotal = cartTotal + deliveryCharge;

            const currentOrder = {
                orderId: newOrderId,
                id: newOrderId, // Legacy support
                userId: userData?.userId || currentUser.uid,
                username: userData?.username || currentUser.displayName,
                email: currentUser.email,
                address: userData?.address || '',
                city: userData?.city || 'Kakinada',
                mobileNumber: formData.phone,
                cartItems: cartItems.map(item => {
                    const restaurant = restaurants.find(r => r.id === item.restaurantId);
                    return {
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        selectedOption: item.selectedOption || null,
                        unit: item.unit || null,
                        restaurantId: item.restaurantId || null,
                        restaurantName: restaurant ? restaurant.name : 'Foodsy Direct'
                    };
                }),
                subtotal: cartTotal,
                deliveryFee: deliveryCharge,
                distance: deliveryDistance,
                totalAmount: finalTotal,
                cookingRequest: formData.cookingRequest || '',
                status: 'Confirmed',
                createdAt: serverTimestamp(),
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                paymentMethod: 'Cash on Delivery',
                paymentStatus: 'Pending',
                transactionId: null
            };

            await setDoc(doc(db, 'orders', newOrderId), currentOrder);

            // Webhook for order notifications to n8n
            try {
                const webhookData = new URLSearchParams();
                webhookData.append('userId', currentOrder.userId);
                webhookData.append('totalAmount', currentOrder.totalAmount);
                webhookData.append('mobileNumber', currentOrder.mobileNumber);
                webhookData.append('email', currentOrder.email);

                await fetch("https://venkataomanand.app.n8n.cloud/webhook/foodsy-order", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: webhookData
                });
            } catch (webhookErr) {
                console.error("Webhook submission failed:", webhookErr);
            }

            alert("Order Confirmed Successfully ✅");
            setOrderSuccess(true);
            setOrderData(currentOrder);
            clearCart();
        } catch (error) {
            console.error("Error creating order:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (orderSuccess && orderData) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    <div className="bg-primary p-6 text-center">
                        <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">Order Successfully Placed!</h1>
                        <p className="text-white/90">Thank you for choosing Foodsy.</p>
                    </div>

                    <div className="p-8">
                        <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-end">
                            <div>
                                <h2 className="text-lg font-medium text-gray-500 mb-1">Order ID</h2>
                                <p className="text-3xl font-mono font-bold text-gray-900">{orderData.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Ordered At</p>
                                <p className="text-sm font-bold text-gray-900">{orderData.date} • {orderData.time}</p>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="border-b border-gray-200 pb-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Details</h3>
                            <div className="flex items-center space-x-3 mb-2">
                                {orderData.paymentMethod === 'Cash on Delivery' ? (
                                    <Banknote className="h-5 w-5 text-green-600" />
                                ) : (
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                )}
                                <span className="text-gray-900 font-medium">{orderData.paymentMethod}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${orderData.paymentStatus === 'Paid'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {orderData.paymentStatus}
                                </span>
                            </div>
                            {orderData.transactionId && (
                                <div className="mt-3 text-sm text-gray-600">
                                    <span className="font-medium">Transaction ID:</span> {orderData.transactionId}
                                </div>
                            )}
                        </div>

                        <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-xl relative">
                            <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                {orderData.status}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="text-2xl mr-2">🧾</span> Official Invoice
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 border-b border-gray-200 pb-6">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 mb-1">Customer Info</p>
                                    <p className="text-base text-gray-900"><span className="font-semibold text-gray-700">Name:</span> {orderData.username}</p>
                                    <p className="text-base text-gray-900"><span className="font-semibold text-gray-700">Account ID:</span> {orderData.userId}</p>
                                    <p className="text-base text-gray-900"><span className="font-semibold text-gray-700">Contact:</span> {orderData.mobileNumber}</p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <p className="text-sm font-semibold text-gray-500 mb-1">Delivery Target</p>
                                    <p className="text-base text-gray-900 line-clamp-3">{orderData.address}</p>
                                    <p className="text-base text-gray-900 font-semibold">{orderData.city}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2">Order Summary</h4>
                                {orderData.cartItems.map((item, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="font-black text-gray-900 text-sm">{item.name}</h5>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">from: {item.restaurantName}</p>
                                            </div>
                                            <span className="font-black text-primary">₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">QTY: {item.quantity}</span>
                                            {(item.selectedOption || item.unit) && (
                                                <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                                    Weight: {item.selectedOption || item.unit}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-gray-200 pt-4 mt-2">
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-gray-900">₹{orderData.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium mb-3">
                                        <div>
                                            <span className="text-gray-600 block">Logistics & Delivery</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precise Distance: {orderData.distance?.toFixed(2)} KM</span>
                                        </div>
                                        <span className="text-gray-900">₹{orderData.deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-200 shadow-inner">
                                        <span className="text-lg font-black text-gray-900 uppercase">Grand Total</span>
                                        <span className="text-2xl font-black text-primary">₹{orderData.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>



                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/orders"
                                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
                            >
                                <Truck className="h-5 w-5 mr-2" />
                                Track Order
                            </Link>
                            <Link
                                to="/"
                                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                <Link to="/products" className="text-primary hover:underline">Start shopping</Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handlePlaceOrder} className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    type="text"
                                    disabled
                                    value={userData?.username || currentUser?.displayName || ''}
                                    className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 text-gray-500 sm:text-sm cursor-not-allowed"
                                />
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    type="email"
                                    disabled
                                    value={currentUser?.email || ''}
                                    className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 text-gray-500 sm:text-sm cursor-not-allowed"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Home Address</label>
                                <input
                                    type="text"
                                    disabled
                                    value={userData?.address || ''}
                                    className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 text-gray-500 sm:text-sm cursor-not-allowed"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    disabled
                                    value={userData?.city || 'Kakinada'}
                                    className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 text-gray-500 sm:text-sm cursor-not-allowed font-bold"
                                />
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 10) {
                                            setFormData({ ...formData, phone: value });
                                        }
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="e.g. 9876543210"
                                    pattern="[0-9]{10}"
                                    title="10-digit phone number required"
                                />
                            </div>
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-black uppercase text-gray-400 mb-1">Cooking Request (Optional)</label>
                                <textarea
                                    value={formData.cookingRequest}
                                    onChange={(e) => setFormData({ ...formData, cookingRequest: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-2xl shadow-sm py-3 px-4 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="e.g. Make it spicy, No onions, etc."
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                        <div className="relative border-2 border-primary bg-primary/5 rounded-lg p-4 shadow-md">
                            <div className="flex items-start space-x-3">
                                <div className="mt-1 p-2 rounded-full bg-primary/10">
                                    <Banknote className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Pay with cash when your order arrives
                                    </p>
                                </div>
                                <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                    <div className="h-2 w-2 bg-white rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Distance: {deliveryDistance.toFixed(2)} KM</span>
                            <span className="text-sm text-gray-500">Delivery Charge: ₹{deliveryCharge.toFixed(2)}</span>
                            <span className="text-lg font-bold">Total: ₹{(cartTotal + deliveryCharge).toFixed(2)}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Place Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
