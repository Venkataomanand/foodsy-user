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
        address: ''
    });

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
        const finalTotal = cartTotal + 5;

        try {
            const currentOrder = {
                id: newOrderId,
                userId: currentUser?.uid || 'guest',
                email: email,
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                total: finalTotal,
                status: 'Placed',
                date: new Date().toLocaleDateString(),
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
                        <div className="border-b border-gray-200 pb-6 mb-6">
                            <h2 className="text-lg font-medium text-gray-500 mb-1">Order ID</h2>
                            <p className="text-3xl font-mono font-bold text-gray-900">{orderData.id}</p>
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
                                {orderData.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{item.name} x {item.quantity}</span>
                                        <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-gray-200 pt-4 flex justify-between text-base font-medium">
                                    <span className="text-gray-900">Subtotal</span>
                                    <span className="text-gray-900">₹{(orderData.total - 5).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base font-medium">
                                    <span className="text-gray-900">Shipping</span>
                                    <span className="text-gray-900">₹5.00</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="text-primary">Total</span>
                                    <span className="text-primary">₹{orderData.total.toFixed(2)}</span>
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
                                <label className="block text-sm font-medium text-gray-700">Street address</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
                        <span className="text-lg font-bold">Total: ₹{(cartTotal + 5).toFixed(2)}</span>
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
