import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import ShortVideos from './pages/ShortVideos';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function App() {
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'store'), (doc) => {
      if (doc.exists()) {
        setIsStoreOpen(doc.data().isOpen);
      }
    });
    return unsub;
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen relative">
              {!isStoreOpen && !window.location.pathname.includes('/admin') && (
                <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                  {/* Floating Emojis Background */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden">
                    <div className="absolute top-10 left-10 text-6xl animate-bounce">🍔</div>
                    <div className="absolute top-40 right-20 text-6xl animate-pulse">🍕</div>
                    <div className="absolute bottom-20 left-1/4 text-6xl animate-bounce" style={{ animationDelay: '1s' }}>🍱</div>
                    <div className="absolute bottom-40 right-1/4 text-6xl animate-pulse" style={{ animationDelay: '0.5s' }}>🍜</div>
                    <div className="absolute top-1/2 left-10 text-6xl animate-bounce" style={{ animationDelay: '1.5s' }}>🥯</div>
                  </div>

                  <div className="relative z-10 max-w-md w-full">
                    <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                      <span className="text-6xl">😴</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                      Store is <span className="text-primary italic underline decoration-wavy">Closed</span>
                    </h1>
                    <p className="text-lg text-gray-600 font-medium mb-8 leading-relaxed">
                      Foodsy is currently resting to bring you fresher, tastier meals soon. We'll be back online shortly!
                    </p>
                    <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl shadow-sm mb-8">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Offline Status</span>
                      </div>
                      <p className="text-sm font-bold text-gray-500">
                        Check back in a few hours or follow our WhatsApp for updates.
                      </p>
                    </div>
                    <button
                      onClick={() => window.open('https://wa.me/918143938358', '_blank')}
                      className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl hover:bg-primary/90 transition-all active:scale-95 group"
                    >
                      <span className="mr-2 group-hover:rotate-12 transition-transform">📲</span>
                      Contact via WhatsApp
                    </button>
                    <p className="mt-8 text-xs font-black text-gray-400 uppercase tracking-widest">FOODSY • KAKINADA</p>
                  </div>
                </div>
              )}

              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/short-videos" element={<ShortVideos />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
