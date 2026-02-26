import { useState, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2, Plus, PlusCircle, RefreshCw, ShoppingBag, Package, Eye, EyeOff, Play, Tag, Search, Building } from 'lucide-react';
import { db, storage } from '../firebase';
import {
    collection,
    getDocs,
    orderBy,
    query,
    doc as firestoreDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MOCK_DATA = [
    { name: "Chicken Biryani", category: "Biryanis", price: 150, description: "Legendary Hyderabadi style biryani with perfectly cooked chicken.", emoji: "�", rating: 4.9 },
    { name: "Family Pulav", category: "Pulavs", price: 350, description: "Deluxe pulav served with raita and spicy curry.", emoji: "🥘", rating: 4.8 },
    { name: "Fresh Apple", category: "Fruits", price: 120, description: "Crunchy and sweet Kashmiri apples.", emoji: "🍎", rating: 4.7 },
    { name: "Spinach (Palak)", category: "Green Leafy Vegetables", price: 30, description: "Fresh farm-picked organic spinach.", emoji: "�", rating: 4.9 },
    { name: "Carrot", category: "Vegetables", price: 40, description: "Fresh and sweet carrots.", emoji: "🥕", rating: 4.5 },
    { name: "Basmati Rice 5kg", category: "Rice & Dals", price: 450, description: "Premium long grain basmati rice.", emoji: "🍚", rating: 4.8 },
    { name: "Gulab Jamun", category: "Desserts", price: 80, description: "Soft and juicy milk-based sweets.", emoji: "�", rating: 4.9 },
    { name: "Cool Drink", category: "Beverages", price: 40, description: "Chilled soft drink.", emoji: "🥤", rating: 4.4 },
];

export default function Admin() {
    const { products, addProduct, updateProduct, deleteProduct, restaurants, addRestaurant, updateRestaurant, deleteRestaurant, loading } = useProduct();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('products');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [shorts, setShorts] = useState([]);
    const [loadingShorts, setLoadingShorts] = useState(false);
    const [offers, setOffers] = useState([]);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [offerData, setOfferData] = useState({ title: '', description: '', code: '', emoji: '🔥' });
    const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });

    // Product Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [product, setProduct] = useState({
        name: '', price: '', category: 'Biryanis', description: '', emoji: '🥑', image: '', unit: '', restaurantId: ''
    });

    // Restaurant Form State
    const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
    const [restaurantEditId, setRestaurantEditId] = useState(null);
    const [restaurantData, setRestaurantData] = useState({
        name: '', image: '', rating: '4.5', deliveryTime: '30-40 min', cuisine: '', address: '', isOpen: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Shorts Form State
    const [shortData, setShortData] = useState({ youtubeId: '', title: '', channel: '' });

    // Store Status State
    const [storeOpen, setStoreOpen] = useState(true);
    const [updatingStore, setUpdatingStore] = useState(false);

    // Search State
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');

    // Utility Functions
    function calculateStats(ordersData) {
        if (!ordersData || !Array.isArray(ordersData)) return;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const currentDay = now.getDay();
        const startOfWeekDate = new Date(now);
        startOfWeekDate.setDate(now.getDate() - currentDay);
        const startOfWeek = startOfWeekDate.getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const daily = ordersData
            .filter(o => ((o.createdAt?.seconds || 0) * 1000) >= startOfDay)
            .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const weekly = ordersData
            .filter(o => ((o.createdAt?.seconds || 0) * 1000) >= startOfWeek)
            .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const monthly = ordersData
            .filter(o => ((o.createdAt?.seconds || 0) * 1000) >= startOfMonth)
            .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        setStats({ daily, weekly, monthly });
    }

    async function fetchOrders() {
        setLoadingOrders(true);
        try {
            const q = query(collection(db, 'orders'));
            const snapshot = await getDocs(q);
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            ordersData.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            setOrders(ordersData);
            calculateStats(ordersData);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoadingOrders(false);
        }
    }

    async function fetchOffers() {
        setLoadingOffers(true);
        try {
            const q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching offers:", error);
        } finally {
            setLoadingOffers(false);
        }
    }

    useEffect(() => {
        const unsubStore = onSnapshot(firestoreDoc(db, 'settings', 'store'), (snapshot) => {
            if (snapshot.exists()) {
                setStoreOpen(snapshot.data().isOpen);
            }
        });

        if (activeTab === 'orders') {
            fetchOrders();
        } else if (activeTab === 'shorts') {
            fetchShorts();
        } else if (activeTab === 'offers') {
            fetchOffers();
        }

        return () => unsubStore();
    }, [activeTab]);

    const handleAddShort = async (e) => {
        e.preventDefault();
        let videoId = shortData.youtubeId.trim();
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = videoId.match(regExp);
        if (match && match[2].length === 11) videoId = match[2];

        if (!videoId || videoId.length !== 11) {
            alert("Please enter a valid YouTube Video ID or URL");
            return;
        }

        try {
            await addDoc(collection(db, 'shorts'), {
                ...shortData,
                youtubeId: videoId,
                likes: Math.floor(Math.random() * 500) + 50,
                createdAt: serverTimestamp()
            });
            alert('Short Video Added!');
            setShortData({ youtubeId: '', title: '', channel: '' });
            fetchShorts();
        } catch (error) {
            console.error("Error adding short:", error);
            alert("Failed to add video");
        }
    };

    const handleDeleteShort = async (id) => {
        if (window.confirm('Delete this video?')) {
            try {
                await deleteDoc(firestoreDoc(db, 'shorts', id));
                setShorts(shorts.filter(s => s.id !== id));
            } catch (error) {
                console.error("Error deleting short:", error);
            }
        }
    };

    const handleAddOffer = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'offers'), {
                ...offerData,
                createdAt: serverTimestamp()
            });
            alert('Offer Added!');
            setOfferData({ title: '', description: '', code: '', emoji: '🔥' });
            fetchOffers();
        } catch (error) {
            console.error("Error adding offer:", error);
            alert("Failed to add offer");
        }
    };

    const handleDeleteOffer = async (id) => {
        if (window.confirm('Delete this offer?')) {
            try {
                await deleteDoc(firestoreDoc(db, 'offers', id));
                setOffers(offers.filter(o => o.id !== id));
            } catch (error) {
                console.error("Error deleting offer:", error);
            }
        }
    };

    const handleAddRestaurant = async (e) => {
        e.preventDefault();
        try {
            if (isEditingRestaurant) {
                await updateRestaurant(restaurantEditId, {
                    ...restaurantData,
                    updatedAt: serverTimestamp()
                });
                alert('Restaurant Updated!');
            } else {
                await addRestaurant({
                    ...restaurantData,
                    createdAt: serverTimestamp()
                });
                alert('Restaurant Added!');
            }
            setRestaurantData({ name: '', image: '', rating: '4.5', deliveryTime: '30-40 min', cuisine: '', address: '', isOpen: true });
            setIsEditingRestaurant(false);
            setRestaurantEditId(null);
        } catch (error) {
            console.error("Error saving restaurant:", error);
            alert("Failed to save restaurant");
        }
    };

    const handleAddItemsToRestaurant = (res) => {
        // Switch to products tab and pre-fill the restaurantId
        setActiveTab('products');
        setIsEditing(false);
        setProduct({ name: '', price: '', category: 'Biryanis', description: '', emoji: '🥑', image: '', unit: '', options: '', restaurantId: res.id });
        // Scroll to top so the form is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditRestaurant = (res) => {
        setIsEditingRestaurant(true);
        setRestaurantEditId(res.id);
        setRestaurantData({
            name: res.name,
            image: res.image || '',
            rating: res.rating || '4.5',
            deliveryTime: res.deliveryTime || '30-40 min',
            cuisine: res.cuisine || '',
            address: res.address || '',
            isOpen: res.isOpen !== false
        });
        setActiveTab('restaurants');
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const orderRef = firestoreDoc(db, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus });
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await deleteDoc(firestoreDoc(db, 'orders', orderId));
            setOrders(orders.filter(o => o.id !== orderId));
            alert('Order deleted successfully!');
        } catch (error) {
            console.error("Error deleting order:", error);
            alert("Failed to delete order");
        }
    };

    const handleAvailabilityToggle = async (id, currentStatus) => {
        try {
            await updateProduct(id, { available: !currentStatus });
            alert(`Product marked as ${!currentStatus ? 'Available' : 'Out of Stock'}`);
        } catch (error) {
            console.error("Error updating availability:", error);
            alert("Failed to update availability");
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) setImageFile(e.target.files[0]);
    };

    const uploadImage = async () => {
        if (!imageFile) return product.image;

        // 1. Check file size (max 5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
            throw new Error("Image is too large (max 5MB). Please use a smaller image.");
        }

        console.log("📸 Starting upload for:", imageFile.name, `${(imageFile.size / 1024).toFixed(2)} KB`);

        try {
            const fileName = `products/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
            const storageRef = ref(storage, fileName);

            // Add metadata for better compatibility
            const metadata = {
                contentType: imageFile.type || 'image/jpeg'
            };

            console.log("📍 Uploading to:", storageRef.fullPath, "with type:", metadata.contentType);

            const snapshot = await uploadBytes(storageRef, imageFile, metadata);
            console.log("✅ Upload successful!");

            const url = await getDownloadURL(snapshot.ref);
            return url;
        } catch (error) {
            console.error("⛔ Firebase Storage Error:", error);

            let userMessage = "Image upload failed.";
            if (error.code === 'storage/unauthorized') {
                userMessage = "PERMISSION DENIED: Please check your Firebase Storage Rules. They must allow writes for authenticated users.";
            } else if (error.code === 'storage/project-not-found') {
                userMessage = "FIREBASE PROJECT NOT FOUND: Check your bucket name in firebase.js";
            } else if (error.message.includes('timeout')) {
                userMessage = "UPLOAD TIMEOUT: Your internet connection might be slow. Try a smaller image.";
            }

            throw new Error(`${userMessage} (${error.code || 'unknown'})`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("🚀 SUBMISSION START", { isEditing, editId, product });

        if (!currentUser) {
            alert("⚠️ Please log in to manage products.");
            return;
        }

        if (!product.name || !product.price) {
            alert("⚠️ Please provide at least a name and price.");
            return;
        }

        setUploading(true);

        try {
            // 1. Image Upload with Timeout
            let imageUrl = product.image;
            if (imageFile) {
                console.log("📸 Uploading image to bucket:", storage?.app?.options?.storageBucket);
                const uploadPromise = uploadImage();
                // Increased timeout to 60 seconds for slower connections
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Image upload timed out (60s). Please check your internet or Firebase Storage rules.")), 60000)
                );
                imageUrl = await Promise.race([uploadPromise, timeoutPromise]);
                console.log("✅ Image URL generated successfully");
            }

            // 2. Prepare Clean Data Object
            const finalProductData = {
                name: String(product.name).trim(),
                price: parseFloat(product.price) || 0,
                category: String(product.category),
                description: String(product.description || "").trim(),
                emoji: String(product.emoji || "🥑"),
                image: imageUrl || "",
                unit: String(product.unit || "").trim(),
                options: String(product.options || "").trim(), // New field for variants
                restaurantId: product.restaurantId || "",
                available: product.available !== undefined ? product.available : true,
                updatedAt: serverTimestamp()
            };

            console.log("💾 Saving to Firestore:", finalProductData);

            // 3. Database Operation with Timeout
            const dbOperation = isEditing
                ? updateDoc(firestoreDoc(db, 'products', editId), finalProductData)
                : addDoc(collection(db, 'products'), { ...finalProductData, createdAt: serverTimestamp() });

            const dbTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Database operation timed out (30s). Check your Firestore connection.")), 30000)
            );

            await Promise.race([dbOperation, dbTimeout]);

            console.log("✨ SUCCESS!");
            alert(`Item ${isEditing ? 'Updated' : 'Added'} Successfully!`);

            // 4. Reset Form
            setProduct({ name: '', price: '', category: activeTab === 'combos' ? 'Combos' : 'Biryanis', description: '', emoji: '🥑', image: '', unit: '', options: '', restaurantId: '' });
            setImageFile(null);
            setUploadProgress(0);
            setIsEditing(false);
            setEditId(null);

            // Clear the file input manually if needed
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error("❌ Submission Failed:", error);
            alert(`ERROR: ${error.message || 'Unknown error occurred'}`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
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
            image: prod.image || '',
            unit: prod.unit || '',
            options: prod.options || '',
            restaurantId: prod.restaurantId || ''
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id);
        }
    };

    const handleSeed = async () => {
        if (window.confirm('Add sample data?')) {
            for (const p of MOCK_DATA) {
                await addProduct(p);
            }
            alert('Added sample data!');
        }
    };

    const toggleStore = async () => {
        setUpdatingStore(true);
        const newStatus = !storeOpen;
        try {
            await setDoc(firestoreDoc(db, 'settings', 'store'), {
                isOpen: newStatus,
                updatedAt: serverTimestamp()
            });
            setStoreOpen(newStatus);
            alert(`Store is now ${newStatus ? 'OPEN' : 'CLOSED'}`);
        } catch (error) {
            console.error("Error updating store status:", error);
            alert("Failed to update store status");
        } finally {
            setUpdatingStore(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage store, orders and shorts</p>
                </div>
                <div className="flex items-center space-x-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col mr-2 text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Store Status</span>
                        <span className={`text-sm font-bold ${storeOpen ? 'text-green-600' : 'text-red-600'}`}>{storeOpen ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                    <button onClick={toggleStore} disabled={updatingStore} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${storeOpen ? 'bg-primary' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${storeOpen ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                    <button onClick={handleSeed} className="ml-4 p-2 text-gray-400 hover:text-primary transition-colors" title="Seed Data"><RefreshCw className="h-5 w-5" /></button>
                </div>
            </div>

            <div className="flex overflow-x-auto space-x-4 mb-8 pb-2">
                <button onClick={() => { setActiveTab('products'); setIsEditing(false); setProduct({ name: '', price: '', category: 'Biryanis', description: '', emoji: '🥑', image: '', unit: '', restaurantId: '' }); }} className={`px-4 py-2 rounded-xl font-bold flex items-center whitespace-nowrap transition-all ${activeTab === 'products' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}><Package className="h-5 w-5 mr-2" /> Products</button>
                <button onClick={() => setActiveTab('restaurants')} className={`px-4 py-2 rounded-xl font-bold flex items-center whitespace-nowrap transition-all ${activeTab === 'restaurants' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}><Building className="h-5 w-5 mr-2" /> Restaurants</button>
                <button onClick={() => { setActiveTab('combos'); setIsEditing(false); setProduct({ name: '', price: '', category: 'Combos', description: '', emoji: '🎁', image: '', unit: '', restaurantId: '' }); }} className={`px-4 py-2 rounded-xl font-bold flex items-center whitespace-nowrap transition-all ${activeTab === 'combos' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}><span className="mr-2">🎁</span> Combos</button>
                <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 rounded-xl font-bold flex items-center whitespace-nowrap transition-all ${activeTab === 'offers' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}><Tag className="h-5 w-5 mr-2" /> Offers</button>
                <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-xl font-bold flex items-center whitespace-nowrap transition-all ${activeTab === 'orders' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}><ShoppingBag className="h-5 w-5 mr-2" /> Orders</button>
                <button onClick={() => setActiveTab('shorts')} className={`px-4 py-2 rounded-xl font-bold flex items-center whitespace-nowrap transition-all ${activeTab === 'shorts' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}><Play className="h-5 w-5 mr-2" /> Shorts</button>
            </div>

            {(activeTab === 'products' || activeTab === 'combos') ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-xl shadow-gray-100/50 rounded-3xl p-6 border border-gray-100">
                            <h2 className="text-xl font-black mb-4 flex items-center">{isEditing ? <Pencil className="h-5 w-5 mr-2 text-primary" /> : <Plus className="h-5 w-5 mr-2 text-primary" />}{isEditing ? 'Update Item' : 'Add New Item'}</h2>
                            {/* Restaurant context banner */}
                            {product.restaurantId && (
                                <div className="mb-4 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
                                    <Building className="h-4 w-4 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Adding items for</p>
                                        <p className="text-sm font-black text-primary truncate">{restaurants.find(r => r.id === product.restaurantId)?.name || 'Selected Restaurant'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setProduct({ ...product, restaurantId: '' })}
                                        className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-xs font-bold flex-shrink-0"
                                    >
                                        ✕ Clear
                                    </button>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div><label className="text-xs font-black uppercase text-gray-400 mb-1 block">Item Name</label><input type="text" required value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="e.g. Chicken Biryani" /></div>
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Image</label>
                                    <div className="space-y-2">
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white" />
                                        <div className="flex items-center gap-2">
                                            <div className="h-[1px] flex-1 bg-gray-100"></div>
                                            <span className="text-[10px] font-bold text-gray-300">OR PASTE URL</span>
                                            <div className="h-[1px] flex-1 bg-gray-100"></div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Paste image link here (e.g. https://...)"
                                            value={product.image}
                                            onChange={e => setProduct({ ...product, image: e.target.value })}
                                            className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    {uploadProgress > 0 && <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className="bg-primary h-1.5 transition-all" style={{ width: `${uploadProgress}%` }}></div></div>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-black uppercase text-gray-400 mb-1 block">Price (₹)</label><input type="number" required value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" /></div>
                                    <div><label className="text-xs font-black uppercase text-gray-400 mb-1 block">Category</label>{activeTab === 'combos' ? <div className="bg-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-400">Combos</div> : <select value={product.category} onChange={e => setProduct({ ...product, category: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20">
                                        <optgroup label="Food">
                                            <option value="Biryanis">Biryanis</option>
                                            <option value="Pulavs">Pulavs</option>
                                            <option value="Desserts">Desserts</option>
                                            <option value="Milkshakes">Milkshakes</option>
                                            <option value="Beverages">Beverages</option>
                                            <option value="Tiffins">Tiffins</option>
                                        </optgroup>
                                        <optgroup label="Vegetables">
                                            <option value="Fruits">Fruits</option>
                                            <option value="Green Leafy Vegetables">Green Leafy Vegetables</option>
                                            <option value="Vegetables">Vegetables</option>
                                        </optgroup>
                                        <optgroup label="Grocery">
                                            <option value="Rice & Dals">Rice & Dals</option>
                                            <option value="Oils & Spices">Oils & Spices</option>
                                            <option value="Snacks & Drinks">Snacks & Drinks</option>
                                            <option value="Essentials">Essentials</option>
                                        </optgroup>
                                    </select>}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Restaurant (Optional)</label>
                                    <select
                                        value={product.restaurantId}
                                        onChange={e => setProduct({ ...product, restaurantId: e.target.value })}
                                        className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">No Specific Restaurant</option>
                                        {restaurants.map(res => (
                                            <option key={res.id} value={res.id}>{res.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Base Unit</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1kg"
                                            value={product.unit}
                                            onChange={e => setProduct({ ...product, unit: e.target.value })}
                                            className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase text-gray-400 mb-1 block text-primary">Selectable Options</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="e.g. 1kg, 500g"
                                                value={product.options}
                                                onChange={e => setProduct({ ...product, options: e.target.value })}
                                                className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                            />
                                            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase px-1">Comma separated</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Emoji Icon</label>
                                        <input type="text" value={product.emoji} onChange={e => setProduct({ ...product, emoji: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold" />
                                    </div>
                                </div>
                                <div><label className="text-xs font-black uppercase text-gray-400 mb-1 block">Description</label><textarea rows={3} value={product.description} onChange={e => setProduct({ ...product, description: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-medium" placeholder="Tasty ingredients..." /></div>
                                <div className="flex gap-3"><button type="submit" disabled={uploading} className="flex-1 bg-gray-900 text-white rounded-2xl p-4 text-sm font-black hover:bg-primary transition-all disabled:opacity-50 shadow-lg shadow-gray-200">{uploading ? 'Processing...' : isEditing ? 'Update Item' : 'Add Item'}</button>{isEditing && <button type="button" onClick={() => { setIsEditing(false); setProduct({ name: '', price: '', category: activeTab === 'combos' ? 'Combos' : 'Biryanis', description: '', emoji: '🥑', unit: '', options: '' }); }} className="bg-gray-100 text-gray-500 rounded-2xl p-4 text-sm font-black">Cancel</button>}</div>
                            </form>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white shadow-xl shadow-gray-100/50 rounded-3xl overflow-hidden border border-gray-100">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center"><h2 className="text-xl font-black">{activeTab === 'combos' ? 'Combos Management' : 'Products Management'}</h2><span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase">{products.filter(p => activeTab === 'combos' ? p.category === 'Combos' : p.category !== 'Combos').length} Total</span></div>
                            <ul className="divide-y divide-gray-50">
                                {products.filter(p => activeTab === 'combos' ? p.category === 'Combos' : p.category !== 'Combos').map((prod) => (
                                    <li key={prod.id} className="p-6 hover:bg-gray-50/50 transition-all flex justify-between items-center group">
                                        <div className="flex items-center">
                                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mr-4 group-hover:scale-110 transition-transform">
                                                {prod.emoji || '🥘'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-gray-900">{prod.name}</h3>
                                                    {prod.unit && (
                                                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-gray-200 uppercase tracking-tighter">
                                                            {prod.unit}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    {prod.category} • ₹{Number(prod.price || 0).toFixed(2)}
                                                    {prod.options && (
                                                        <span className="ml-1 text-primary">
                                                            • Options: {prod.options}
                                                        </span>
                                                    )}
                                                    {prod.restaurantId && ` • ${restaurants.find(r => r.id === prod.restaurantId)?.name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAvailabilityToggle(prod.id, prod.available !== false)} className={`p-2 rounded-xl transition-all ${prod.available !== false ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
                                                {prod.available !== false ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                            </button>
                                            <button onClick={() => handleEdit(prod)} className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100">
                                                <Pencil className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(prod.id)} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'offers' ? (
                <div className="bg-white shadow-xl shadow-gray-100/50 rounded-3xl p-6 border border-gray-100">
                    <h2 className="text-xl font-black mb-8 flex items-center"><Tag className="h-6 w-6 mr-2 text-primary" /> Promotional Offers</h2>
                    <form onSubmit={handleAddOffer} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                        <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Offer Title</label><input type="text" required value={offerData.title} onChange={e => setOfferData({ ...offerData, title: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold" placeholder="e.g. 50% OFF" /></div>
                        <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Offer Code</label><input type="text" value={offerData.code} onChange={e => setOfferData({ ...offerData, code: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold" placeholder="e.g. WELCOME50" /></div>
                        <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Emoji</label><input type="text" value={offerData.emoji} onChange={e => setOfferData({ ...offerData, emoji: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold" /></div>
                        <div className="md:col-span-3"><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Description</label><input type="text" required value={offerData.description} onChange={e => setOfferData({ ...offerData, description: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold" placeholder="Offer details..." /></div>
                        <div className="flex items-end"><button type="submit" className="w-full bg-gray-900 text-white rounded-2xl p-4 text-sm font-black hover:bg-primary transition-all shadow-lg shadow-gray-200">Add Offer</button></div>
                    </form>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {offers.map(o => (
                            <div key={o.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 group relative">
                                <button onClick={() => handleDeleteOffer(o.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="h-5 w-5" /></button>
                                <div className="text-4xl mb-4">{o.emoji || '🔥'}</div>
                                <h4 className="font-black text-lg text-gray-900">{o.title}</h4>
                                <p className="text-gray-500 text-sm font-medium mt-1">{o.description}</p>
                                {o.code && <div className="mt-4 inline-block bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{o.code}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'orders' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-green-100/20 border border-green-50"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Today's Revenue</p><p className="text-3xl font-black text-green-600 mt-1">₹{Number(stats.daily || 0).toFixed(2)}</p></div>
                        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-100/20 border border-blue-50"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Weekly Sales</p><p className="text-3xl font-black text-blue-600 mt-1">₹{Number(stats.weekly || 0).toFixed(2)}</p></div>
                        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-purple-100/20 border border-purple-50"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Monthly Growth</p><p className="text-3xl font-black text-purple-600 mt-1">₹{Number(stats.monthly || 0).toFixed(2)}</p></div>
                    </div>
                    <div className="bg-white shadow-xl shadow-gray-100/50 rounded-3xl overflow-hidden border border-gray-100">
                        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h2 className="text-xl font-black">Live Orders</h2>
                            <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100 w-full md:w-96">
                                <Search className="h-4 w-4 text-gray-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID or User ID..."
                                    value={orderSearchQuery}
                                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full"
                                />
                            </div>
                            {loadingOrders && <RefreshCw className="h-5 w-5 animate-spin text-primary" />}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Status</th>
                                        <th className="px-6 py-4 text-left">Order Details</th>
                                        <th className="px-6 py-4 text-left">Customer</th>
                                        <th className="px-6 py-4 text-left">Items</th>
                                        <th className="px-6 py-4 text-left">Total</th>
                                        <th className="px-6 py-4 text-left">Time</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders
                                        .filter(o =>
                                            o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                            (o.userId && o.userId.toLowerCase().includes(orderSearchQuery.toLowerCase()))
                                        )
                                        .map((o) => (
                                            <tr key={o.id} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={o.status || 'Placed'}
                                                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                                        className="bg-white border-0 rounded-full text-[10px] font-black py-1.5 pl-3 pr-8 shadow-sm focus:ring-2 focus:ring-primary/20"
                                                    >
                                                        <option value="Placed">Placed</option>
                                                        <option value="Ready">Ready</option>
                                                        <option value="Picked Up">Picked Up</option>
                                                        <option value="Delivered">Delivered</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-[10px] text-gray-900 leading-none mb-1">{o.id}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">UID: {o.userId?.substring(0, 8)}...</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-sm text-gray-900">{o.fullName || o.firstName || o.email?.split('@')[0]}</div>
                                                    <div className="text-[10px] font-bold text-gray-500">{o.phone || 'N/A'}</div>
                                                    <div className="text-[9px] font-medium text-gray-400 line-clamp-1">{o.address}</div>
                                                </td>
                                                <td className="px-6 py-4 max-w-[250px]">
                                                    {o.isCustom ? (
                                                        <span className="text-primary font-bold">{o.customList}</span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            {o.items?.map((i, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                                    <span className="font-black text-[10px] text-gray-900 line-clamp-1 flex-1">{i.name}</span>
                                                                    {(i.selectedOption || i.unit) && (
                                                                        <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap border border-orange-200">
                                                                            WEIGHT: {i.selectedOption || i.unit}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] font-black text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                                                                        x{i.quantity}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-black text-gray-900">₹{Number(o.total || 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{o.date} {o.time}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => deleteOrder(o.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'shorts' ? (
                <div className="bg-white shadow-xl shadow-gray-100/50 rounded-3xl p-6 border border-gray-100">
                    <h2 className="text-xl font-black mb-8 flex items-center"><Play className="h-6 w-6 mr-2 text-red-500 fill-red-500" /> Short Videos Manager</h2>
                    <form onSubmit={handleAddShort} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                        <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">YouTube URL / ID</label><input type="text" required value={shortData.youtubeId} onChange={e => setShortData({ ...shortData, youtubeId: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold" placeholder="Paste link here..." /></div>
                        <div><label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Title</label><input type="text" required value={shortData.title} onChange={e => setShortData({ ...shortData, title: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold" /></div>
                        <div className="flex items-end"><button type="submit" className="w-full bg-gray-900 text-white rounded-2xl p-4 text-sm font-black hover:bg-primary transition-all shadow-lg shadow-gray-200">Add Short</button></div>
                    </form>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shorts.map(s => (
                            <div key={s.id} className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 group">
                                <div className="relative aspect-[9/16] bg-gray-900"><img src={`https://img.youtube.com/vi/${s.youtubeId}/maxresdefault.jpg`} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" /><button onClick={() => handleDeleteShort(s.id)} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-red-500 transition-all"><Trash2 className="h-5 w-5" /></button></div>
                                <div className="p-4"><h4 className="font-black text-sm text-gray-900 line-clamp-1">{s.title}</h4></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'restaurants' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-xl shadow-gray-100/50 rounded-3xl p-6 border border-gray-100">
                            <h2 className="text-xl font-black mb-6 flex items-center">
                                <Building className="h-5 w-5 mr-2 text-primary" />
                                {isEditingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
                            </h2>
                            <form onSubmit={handleAddRestaurant} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Restaurant Name</label>
                                    <input type="text" required value={restaurantData.name} onChange={e => setRestaurantData({ ...restaurantData, name: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="e.g. Paradise Biryani" />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Image URL</label>
                                    <input type="text" required value={restaurantData.image} onChange={e => setRestaurantData({ ...restaurantData, image: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="Paste link here..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Rating</label>
                                        <input type="text" value={restaurantData.rating} onChange={e => setRestaurantData({ ...restaurantData, rating: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Delivery Time</label>
                                        <input type="text" value={restaurantData.deliveryTime} onChange={e => setRestaurantData({ ...restaurantData, deliveryTime: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Address</label>
                                    <textarea rows="2" value={restaurantData.address} onChange={e => setRestaurantData({ ...restaurantData, address: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="e.g. 1-23, Main Road, Kakinada" />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Cuisine / Tags</label>
                                    <input type="text" placeholder="e.g. North Indian, Chinese" value={restaurantData.cuisine} onChange={e => setRestaurantData({ ...restaurantData, cuisine: e.target.value })} className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-gray-400">Availability</span>
                                        <span className={`text-xs font-black ${restaurantData.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                            Restaurant is {restaurantData.isOpen ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRestaurantData({ ...restaurantData, isOpen: !restaurantData.isOpen })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${restaurantData.isOpen ? 'bg-primary' : 'bg-gray-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${restaurantData.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" className="flex-1 bg-gray-900 text-white rounded-2xl p-4 text-sm font-black hover:bg-primary transition-all shadow-lg">
                                        {isEditingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
                                    </button>
                                    {isEditingRestaurant && (
                                        <button type="button" onClick={() => { setIsEditingRestaurant(false); setRestaurantEditId(null); setRestaurantData({ name: '', image: '', rating: '4.5', deliveryTime: '30-40 min', cuisine: '', address: '', isOpen: true }); }} className="bg-gray-100 text-gray-500 rounded-2xl p-4 text-sm font-black">
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-xl shadow-gray-100/50 rounded-3xl overflow-hidden border border-gray-100">
                            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <h2 className="text-xl font-black">All Restaurants</h2>
                                <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100 w-full md:w-80">
                                    <Search className="h-4 w-4 text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Search restaurants..."
                                        value={restaurantSearchQuery}
                                        onChange={(e) => setRestaurantSearchQuery(e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-xs font-bold w-full"
                                    />
                                </div>
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase">{restaurants.length} Total</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                                {restaurants
                                    .filter(res => res.name.toLowerCase().includes(restaurantSearchQuery.toLowerCase()))
                                    .map(res => (
                                        <div key={res.id} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group">
                                            <div className="relative h-32 w-full">
                                                <img src={res.image || 'https://via.placeholder.com/400x200'} alt={res.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                {/* Closed overlay */}
                                                {res.isOpen === false && (
                                                    <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                                                        <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Closed</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <button onClick={() => handleEditRestaurant(res)} className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Pencil className="h-4 w-4" /></button>
                                                    <button onClick={() => deleteRestaurant(res.id)} className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                                {/* ON/OFF Toggle */}
                                                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-lg shadow-sm">
                                                    <button
                                                        onClick={() => updateRestaurant(res.id, { isOpen: res.isOpen === false ? true : false })}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${res.isOpen !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${res.isOpen !== false ? 'translate-x-4' : 'translate-x-1'}`} />
                                                    </button>
                                                    <span className={`text-[9px] font-black uppercase ${res.isOpen !== false ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {res.isOpen !== false ? 'Open' : 'Closed'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="font-black text-gray-900">{res.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{res.cuisine || 'Multi-cuisine'}</p>
                                                <p className="text-[9px] font-medium text-gray-400 line-clamp-1 mb-2">{res.address || 'No address added'}</p>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-black">⭐ {res.rating}</span>
                                                    <span className="text-[10px] font-bold text-gray-500">🕒 {res.deliveryTime}</span>
                                                </div>
                                                {/* Item count badge */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg">
                                                        {products.filter(p => p.restaurantId === res.id).length} items linked
                                                    </span>
                                                </div>
                                                {/* Add Items Button */}
                                                <button
                                                    onClick={() => handleAddItemsToRestaurant(res)}
                                                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-xs font-black py-2.5 rounded-xl hover:bg-primary transition-all group/btn"
                                                >
                                                    <PlusCircle className="h-4 w-4 group-hover/btn:rotate-90 transition-transform" />
                                                    Add Items to this Restaurant
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null
            }
        </div >
    );
}
