import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, documentId } from 'firebase/firestore';
import { Package, Truck, MapPin, CheckCircle, Clock, Banknote, CreditCard } from 'lucide-react';

const STATUS_STEPS = [
    { label: 'Placed', icon: Clock },
    { label: 'Ready', icon: Package },
    { label: 'Picked Up', icon: Truck },
    { label: 'Delivered', icon: CheckCircle },
];

export default function Orders() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe;

        const handleOrdersSnapshot = (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sort
            ordersData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            setOrders(ordersData);
            setLoading(false);
        };

        const handleError = (error) => {
            console.error("Error fetching orders:", error);
            setLoading(false);
        };

        if (currentUser) {
            const q = query(
                collection(db, 'orders'),
                where('userId', '==', currentUser.uid)
                // orderBy('createdAt', 'desc') // Requires index
            );
            unsubscribe = onSnapshot(q, handleOrdersSnapshot, handleError);
        } else {
            // Guest User: Check local storage
            const localOrderIds = JSON.parse(localStorage.getItem('myOrders') || '[]');

            if (localOrderIds.length > 0) {
                // Limit to 10 most recent to avoid Firestore 'in' query limits
                const recentIds = localOrderIds.slice(0, 10);
                const q = query(
                    collection(db, 'orders'),
                    where(documentId(), 'in', recentIds)
                );
                unsubscribe = onSnapshot(q, handleOrdersSnapshot, handleError);
            } else {
                setLoading(false);
            }
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

    if (orders.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
                <p className="text-gray-600">Go place some orders and they will show up here!</p>
            </div>
        );
    }

    function getStepIndex(status) {
        let normalizedStatus = status;
        // Map legacy statuses to new workflow
        if (status === 'Packed') normalizedStatus = 'Ready';
        if (status === 'Out for Delivery') normalizedStatus = 'Picked Up';

        const index = STATUS_STEPS.findIndex(s => s.label === normalizedStatus);
        return index === -1 ? 0 : index;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Your Orders</h1>

            {/* User Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Spent</p>
                    <p className="text-3xl font-black text-primary mt-2">
                        ₹{orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Orders Placed</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{orders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Orders</p>
                    <p className="text-3xl font-black text-yellow-600 mt-2">
                        {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Picked Up').length}
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                {orders.map((order) => {
                    const currentStep = getStepIndex(order.status);

                    return (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Order {order.id}</h3>
                                        <p className="text-sm text-gray-500">{order.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary">₹{order.total.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Payment Information */}
                                {order.paymentMethod && (
                                    <div className="flex items-center space-x-4 pt-3 border-t border-gray-200">
                                        <div className="flex items-center space-x-2">
                                            {order.paymentMethod === 'Cash on Delivery' ? (
                                                <Banknote className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <CreditCard className="h-4 w-4 text-blue-600" />
                                            )}
                                            <span className="text-sm font-medium text-gray-700">{order.paymentMethod}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'Paid'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.paymentStatus}
                                        </span>
                                        {order.transactionId && (
                                            <span className="text-xs text-gray-500">TXN: {order.transactionId}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="mb-8">
                                    <p className="font-medium text-gray-700 mb-2">Items:</p>
                                    <p className="text-gray-600">
                                        {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative">
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2" />
                                    <div
                                        className="absolute top-1/2 left-0 h-1 bg-primary -z-10 transform -translate-y-1/2 transition-all duration-500"
                                        style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                                    />

                                    <div className="flex justify-between w-full">
                                        {STATUS_STEPS.map((step, index) => {
                                            const Icon = step.icon;
                                            const isCompleted = index <= currentStep;
                                            const isCurrent = index === currentStep;

                                            return (
                                                <div key={step.label} className="flex flex-col items-center">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-colors duration-300 ${isCompleted ? 'border-primary text-primary' : 'border-gray-300 text-gray-400'
                                                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <span className={`mt-2 text-xs sm:text-sm font-medium ${isCompleted ? 'text-primary' : 'text-gray-500'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
