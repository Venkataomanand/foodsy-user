import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);

    function addToCart(item, quantity = 1) {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(i => i.id === item.id);
            if (existingItem) {
                return prevItems.map(i =>
                    i.id === item.id
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            }
            return [...prevItems, { ...item, quantity }];
        });
    }

    function removeFromCart(id) {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    }

    function updateQuantity(id, quantity) {
        if (quantity < 1) {
            removeFromCart(id);
            return;
        }
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, quantity } : item
            )
        );
    }

    function clearCart() {
        setCartItems([]);
    }

    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}
