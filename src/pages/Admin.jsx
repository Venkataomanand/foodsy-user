import { useState, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { Pencil, Trash2, Plus, RefreshCw, ShoppingBag, Package } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const MOCK_DATA = [
    { name: "Biryani + Beverage Combo", category: "Combos", price: 249, description: "Authentic Dum Biryani served with a cool refreshing beverage.", emoji: "🍱", rating: 4.8 },
    { name: "Biryani + Milkshake Combo", category: "Combos", price: 299, description: "Delicious Biryani paired with our signature thick milkshake.", emoji: "🎁", rating: 4.9 },
    { name: "Avocado Toast", category: "Food", price: 120, description: "Fresh avocado on sourdough", emoji: "🥑", rating: 4.5 },
    { name: "Fresh Box", category: "Vegetables", price: 250, description: "Seasonal organic mix", emoji: "🥬", rating: 4.3 },
    { name: "Milk & Eggs", category: "Grocery", price: 150, description: "Daily essentials", emoji: "🥛", rating: 4.7 },
];

export default function Admin() {
    const { products, addProduct, updateProduct, deleteProduct, loading } = useProduct();
    const [activeTab, setActiveTab] = useState('products');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Product Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [product, setProduct] = useState({
        name: '',
        price: '',
        category: 'Food',
        description: '',
        emoji: '🥑',
        image: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab]);

    async function fetchOrders() {
        setLoadingOrders(true);
        try {
            // Fetch all orders
            const q = query(collection(db, 'orders'));
            const snapshot = await getDocs(q);
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort manually
            ordersData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setOrders(ordersData);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoadingOrders(false);
        }
    }

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus });

            // Update local state to reflect change immediately
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return product.image;

        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, imageFile);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload failed", error);
                    reject(error);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        resolve(downloadURL);
                    });
                }
            );
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrl = product.image;
            if (imageFile) {
                imageUrl = await uploadImage();
            }

            const productData = {
                ...product,
                price: Number(product.price),
                image: imageUrl
            };

            if (isEditing) {
                await updateProduct(editId, productData);
                alert('Product Updated!');
            } else {
                await addProduct(productData);
                alert('Product Added!');
            }
            // Reset form
            setProduct({ name: '', price: '', category: 'Food', description: '', emoji: '🥑', image: '' });
            setImageFile(null);
            setUploadProgress(0);
            setIsEditing(false);
            setEditId(null);
        } catch (error) {
            console.error(error);
            alert('Error saving product');
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (prod) => {
        setIsEditing(true);
        setEditId(prod.id);
        setProduct({
            name: prod.name,
            price: prod.price,
            category: prod.category,
            description: prod.description,
            emoji: prod.emoji || '🥑',
            image: prod.image || ''
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id);
        }
    };

    const handleSeed = async () => {
        if (window.confirm('Add sample data?')) {
            MOCK_DATA.forEach(async p => {
                await addProduct(p);
            });
            alert('Added sample data!');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
                {activeTab === 'products' && (
                    <button onClick={handleSeed} className="flex items-center text-sm text-primary hover:underline">
                        <RefreshCw className="h-4 w-4 mr-1" /> Seed Database
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-8">
                <button
                    onClick={() => { setActiveTab('products'); setProduct({ ...product, category: 'Food' }); }}
                    className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'products' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Package className="h-5 w-5 mr-2" /> Products
                </button>
                <button
                    onClick={() => { setActiveTab('combos'); setProduct({ ...product, category: 'Combos' }); }}
                    className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'combos' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <span className="mr-2">🎁</span> Combos
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 rounded-md font-medium flex items-center ${activeTab === 'orders' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <ShoppingBag className="h-5 w-5 mr-2" /> Orders
                </button>
            </div>

            {(activeTab === 'products' || activeTab === 'combos') ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow rounded-lg p-6 sticky top-24">
                            <h2 className="text-xl font-semibold mb-6 flex items-center">
                                {isEditing ? <Pencil className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                                {activeTab === 'combos'
                                    ? (isEditing ? 'Edit Combo' : 'Add New Combo')
                                    : (isEditing ? 'Edit Product' : 'Add New Product')
                                }
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{activeTab === 'combos' ? 'Combo Name' : 'Product Name'}</label>
                                    <input
                                        type="text" required value={product.name}
                                        onChange={e => setProduct({ ...product, name: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary"
                                        placeholder={activeTab === 'combos' ? "e.g. Biryani + Sprite" : "e.g. Avocado Toast"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                    {uploadProgress > 0 && uploadProgress < 100 && (
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    )}
                                    {product.image && !imageFile && (
                                        <div className="mt-2">
                                            <img src={product.image} alt="Current" className="h-20 w-20 object-cover rounded-md border" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Emoji Icon</label>
                                    <input
                                        type="text" value={product.emoji}
                                        onChange={e => setProduct({ ...product, emoji: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary"
                                        placeholder={activeTab === 'combos' ? "🎁" : "🍔"}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                                        <input
                                            type="number" required value={product.price}
                                            onChange={e => setProduct({ ...product, price: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                        {activeTab === 'combos' ? (
                                            <div className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md py-2 px-3 text-gray-500 cursor-not-allowed">
                                                Combos
                                            </div>
                                        ) : (
                                            <select
                                                value={product.category}
                                                onChange={e => setProduct({ ...product, category: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary"
                                            >
                                                <option value="Food">Food</option>
                                                <option value="Vegetables">Vegetables</option>
                                                <option value="Grocery">Grocery</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        rows={3} value={product.description}
                                        onChange={e => setProduct({ ...product, description: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary"
                                        placeholder={activeTab === 'combos' ? "What's in this combo?" : "Short description..."}
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-1 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {uploading ? 'Uploading...' : isEditing ? 'Update' : 'Add'}
                                    </button>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditId(null);
                                                setProduct({ name: '', price: '', category: activeTab === 'combos' ? 'Combos' : 'Food', description: '', emoji: activeTab === 'combos' ? '🍱' : '🥑' });
                                            }}
                                            className="py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold">
                                    {activeTab === 'combos' ? 'Combos List' : 'Products List'}
                                    ({products.filter(p => activeTab === 'combos' ? p.category === 'Combos' : p.category !== 'Combos').length})
                                </h2>
                            </div>
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Loading...</div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {products
                                        .filter(p => activeTab === 'combos' ? p.category === 'Combos' : p.category !== 'Combos')
                                        .map((prod) => (
                                            <li key={prod.id} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <span className="text-3xl mr-4">{prod.emoji || '📦'}</span>
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">{prod.name}</h3>
                                                        <p className="text-sm text-gray-500">{prod.category} • ₹{prod.price}</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(prod)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(prod.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    {products.filter(p => activeTab === 'combos' ? p.category === 'Combos' : p.category !== 'Combos').length === 0 && (
                                        <li className="p-8 text-center text-gray-500">
                                            No {activeTab} found.
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Orders Tab
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold">Customer Orders</h2>
                    </div>
                    {loadingOrders ? (
                        <div className="p-8 text-center text-gray-500">Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No orders found.</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                                    <p className="text-3xl font-black text-gray-900 mt-2">
                                        ₹{orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
                                    <p className="text-3xl font-black text-gray-900 mt-2">{orders.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Orders</p>
                                    <p className="text-3xl font-black text-yellow-600 mt-2">
                                        {orders.filter(o => o.status === 'Placed' || o.status === 'Ready').length}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Fee</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.isCustom ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {order.isCustom ? 'Custom List' : 'Standard'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="font-medium text-gray-900">{order.firstName} {order.lastName}</div>
                                                    <div>{order.email}</div>
                                                    <div className="text-xs text-primary font-bold">{order.phone}</div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500 max-w-xs">
                                                    <div className="line-clamp-2">{order.address || 'N/A'}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <select
                                                        value={order.status || 'Placed'}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        className={`block w-full text-xs font-semibold rounded-full border-0 py-1 pl-2 pr-8 cursor-pointer focus:ring-2 focus:ring-primary ${(order.status === 'Delivered') ? 'bg-green-100 text-green-800' :
                                                            (order.status === 'Picked Up') ? 'bg-blue-100 text-blue-800' :
                                                                (order.status === 'Ready') ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        <option value="Placed">Placed</option>
                                                        <option value="Ready">Ready</option>
                                                        <option value="Picked Up">Picked Up</option>
                                                        <option value="Delivered">Delivered</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div>₹{order.deliveryFee ? order.deliveryFee.toFixed(2) : '0.00'}</div>
                                                    <div className="text-[10px] text-gray-400">({order.distance || 0} km)</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{order.total ? order.total.toFixed(2) : 'N/A'}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
