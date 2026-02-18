import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Truck, Wallet, Banknote, CreditCard } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Checkout() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        area: '',
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
        { name: "Vakalapudi", distance: 6 },
        { name: "Turangi", distance: 5 },
        { name: "Thimmapuram", distance: 8 },
        { name: "Rayudupalem", distance: 7 },
        { name: "Kovvada", distance: 8 },
        { name: "Balaji Cheruvu", distance: 2 },
        { name: "Beach Road", distance: 5 },
        { name: "Dummulapeta", distance: 6 },
        { name: "Nagamallithota", distance: 1 },
        { name: "JNTUK Area", distance: 0 }
    ].sort((a, b) => a.name.localeCompare(b.name));

    const calculateDeliveryCharge = (dist) => {
        if (dist <= 5) return 25;
        // Corrected logic: 25 base + 7 for every km AFTER 5
        const extraKm = dist - 5;
        return 25 + (extraKm * 7);
    };

    const handleAreaChange = (e) => {
        const selectedArea = AREAS.find(a => a.name === e.target.value);
        if (selectedArea) {
            setFormData({ ...formData, area: selectedArea.name });
            setDeliveryDistance(selectedArea.distance);
            setDeliveryCharge(calculateDeliveryCharge(selectedArea.distance));
        } else {
            setFormData({ ...formData, area: '' });
            setDeliveryDistance(0);
            setDeliveryCharge(0);
        }
    };

    // Generate Custom ID: First 2 chars of Name (uppercase) + Date (YYYYMMDD) + Random
    const generateOrderId = (firstName) => {
        const prefix = firstName ? firstName.substring(0, 2).toUpperCase() : 'GU';
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${prefix}-${year}${month}${day}-${Math.floor(Math.random() * 1000)}`;
    };

    async function handlePlaceOrder(e) {
        e.preventDefault();
        setLoading(true);

        const email = currentUser?.email || 'guest@example.com';
        const newOrderId = generateOrderId(formData.firstName);
        const finalTotal = cartTotal + deliveryCharge;

        try {
            const currentOrder = {
                id: newOrderId,
                userId: currentUser?.uid || 'guest',
                email: email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                address: `${formData.address}, ${formData.area}`,
                area: formData.area,
                distance: deliveryDistance,
                deliveryFee: deliveryCharge,
                phone: formData.phone,
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    selectedOption: item.selectedOption || null
                })),
                total: finalTotal,
                status: 'Placed',
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: serverTimestamp(),
                paymentMethod: 'Cash on Delivery',
                paymentStatus: 'Pending',
                transactionId: null
            };

            // Save to Firestore
            await setDoc(doc(db, 'orders', newOrderId), currentOrder);

            // Save order ID to local storage for guest tracking
            const existingOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
            if (!existingOrders.includes(newOrderId)) {
                localStorage.setItem('myOrders', JSON.stringify([newOrderId, ...existingOrders]));
            }

            // Success state locally
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

                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice</h3>
                            <div className="space-y-4">
                                {orderData.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <div>
                                            <span className="text-gray-600">{item.name} x {item.quantity}</span>
                                            {item.selectedOption && (
                                                <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase">
                                                    {item.selectedOption}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-base font-medium">
                                    <span className="text-gray-900">Subtotal</span>
                                    <span className="text-gray-900">₹{cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base font-medium">
                                    <span className="text-gray-900">Delivery Fee</span>
                                    <span className="text-gray-900">₹{orderData.deliveryFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="text-primary">Total</span>
                                    <span className="text-primary">₹{orderData.total.toFixed(2)}</span>
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
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">First name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Last name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Delivery Area</label>
                                <select
                                    required
                                    value={formData.area}
                                    onChange={handleAreaChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                >
                                    <option value="">Select your area...</option>
                                    {AREAS.map(area => (
                                        <option key={area.name} value={area.name}>
                                            {area.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Street Address / House No.</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="e.g. Flat 402, Sai Residency"
                                />
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="e.g. 9876543210"
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
