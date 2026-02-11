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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('category'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
            setLoading(false);
        });

        return unsubscribe;
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
