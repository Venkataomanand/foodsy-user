export interface User {
    id?: number;
    userId: string;
    username: string;
    email: string;
    address: string;
    city: string;
    createdAt?: string | Date;
}

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    id?: number;
    orderId: string;
    userId: string;
    mobileNumber: string;
    cartItems: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    status: 'Confirmed' | 'Preparing' | 'On the Way' | 'Delivered';
    createdAt?: string | Date;
}
