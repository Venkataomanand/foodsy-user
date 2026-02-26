import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from 'firebase/firestore';

const ProductContext = createContext();

export function useProduct() {
    return useContext(ProductContext);
}

export function ProductProvider({ children }) {
    const [products, setProducts] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const qProducts = query(collection(db, 'products'), orderBy('category'));
        const unsubProducts = onSnapshot(qProducts, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        const qRestaurants = query(collection(db, 'restaurants'), orderBy('name'));
        const unsubRestaurants = onSnapshot(qRestaurants, (snapshot) => {
            setRestaurants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubProducts();
            unsubRestaurants();
        };
    }, []);

    async function addProduct(product) {
        return addDoc(collection(db, 'products'), product);
    }

    async function updateProduct(id, updates) {
        const productRef = doc(db, 'products', id);
        return updateDoc(productRef, updates);
    }

    async function deleteProduct(id) {
        const productRef = doc(db, 'products', id);
        return deleteDoc(productRef);
    }

    const value = {
        products,
        restaurants,
        addProduct,
        updateProduct,
        deleteProduct,
        loading
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}
