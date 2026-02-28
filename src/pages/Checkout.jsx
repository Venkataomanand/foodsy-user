import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Truck, Wallet, Banknote, CreditCard } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';

export default function Checkout() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { currentUser, userData } = useAuth();
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
        phone: ''
    });
    const [deliveryDistance, setDeliveryDistance] = useState(0);
    const [deliveryCharge, setDeliveryCharge] = useState(0);

    const AREAS = [
        { name: "Sarpavaram", distance: 3 },
        { name: "Ramanayapeta", distance: 2 },
        { name: "Gandhi Nagar", distance: 2 },
        { name: "Ashok Nagar", distance: 3 },
        { name: "Vidya Nagar", distance: 3 },
        { name: "Bank Colony", distance: 3 },
        { name: "Revenue Colony", distance: 3 },
        { name: "Teachers' Colony", distance: 3 },
        { name: "G.P.T. Colony", distance: 4 },
        { name: "Maruti Nagar", distance: 4 },
        { name: "Lalitha Nagar", distance: 4 },
        { name: "Madura Nagar", distance: 4 },
        { name: "Santhi Nagar", distance: 4 },
        { name: "Rama Rao Peta", distance: 2 },
        { name: "Bhanugudi Junction", distance: 1 },
        { name: "Jagannaickpur", distance: 5 },
        { name: "Kacheripeta", distance: 5 },
        { name: "Vakalapudi", distance: 4.6 },
        { name: "Turangi", distance: 5 },
        { name: "Thimmapuram", distance: 8 },
        { name: "Rayudupalem", distance: 7 },
        { name: "Kovvada", distance: 8 },
        { name: "Balaji Cheruvu", distance: 2 },
        { name: "Beach Road", distance: 5 },
        { name: "Dummulapeta", distance: 5 },
        { name: "Nagamallithota", distance: 1 },
        { name: "JNTUK Area", distance: 0 }
    ].sort((a, b) => a.name.localeCompare(b.name));

    const calculateDeliveryCharge = (dist) => {
        if (dist === 0) return 0;
        if (dist <= 1) return 15;
        // ₹15 for first km + ₹10 for every additional km
        const extraKm = Math.ceil(dist - 1);
        return 15 + (extraKm * 10);
    };

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
                cartItems: cartItems.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    selectedOption: item.selectedOption || null,
                    unit: item.unit || null
                })),
                subtotal: cartTotal,
                deliveryFee: deliveryCharge,
                totalAmount: finalTotal,
                status: 'Confirmed',
                createdAt: serverTimestamp(),
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                paymentMethod: 'Cash on Delivery',
                paymentStatus: 'Pending',
                transactionId: null
            };

            await setDoc(doc(db, 'orders', newOrderId), currentOrder);

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
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-black text-gray-700">{item.quantity}x</span>
                                            <span className="text-gray-800 font-medium">{item.name}</span>
                                            {item.selectedOption && (
                                                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase">
                                                    {item.selectedOption}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-gray-200 pt-4 mt-2">
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-gray-900">₹{orderData.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium mb-3">
                                        <span className="text-gray-600">Logistics & Delivery</span>
                                        <span className="text-gray-900">₹{orderData.deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-200 shadow-inner">
                                        <span className="text-lg font-black text-gray-900 uppercase">Grand Total</span>
                                        <span className="text-2xl font-black text-primary">₹{orderData.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 border-t border-gray-200 pt-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="mr-2">📺</span> While you wait...
                            </h3>
                            <p className="text-gray-600 mb-4">Enjoy these satisfying food shorts while we prepare your order!</p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                {[
                                    { id: '1', yId: 'GZ6r_qNDXuY', title: 'Veg Daal Prep' },
                                    { id: '2', yId: 'Hm040goA_pW', title: 'Chicken Prep' },
                                    { id: '3', yId: 'Eplga_RY6Ne', title: 'Quick Breakfast' }
                                ].map((vid) => (
                                    <div key={vid.id} className="bg-black rounded-lg overflow-hidden relative pt-[177.77%] shadow-md group">
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={`https://www.youtube.com/embed/${vid.yId}?rel=0&modestbranding=1&loop=1&playlist=${vid.yId}&controls=0`}
                                            title={vid.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="text-center">
                                <Link to="/short-videos" className="text-primary font-medium hover:underline flex items-center justify-center">
                                    Watch more food videos <span className="ml-1">→</span>
                                </Link>
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
