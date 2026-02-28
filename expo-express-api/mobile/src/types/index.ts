export interface User {
    id?: number;
    userId: string;
    username: string;
    email: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
    createdAt?: string | Date;
}

export interface Shop {
    id?: number;
    shopName: string;
    shopType: 'Restaurant' | 'Vegetables' | 'Grocery';
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    createdAt?: string | Date;
}

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedOption?: string;
    unit?: string;
}

export interface Order {
    id?: number;
    orderId: string;
    userId: string;
    shopId: number;
    mobileNumber: string;
    distance: number;
    deliveryFee: number;
    cartItems: OrderItem[];
    subtotal: number;
    totalAmount: number;
    status: 'Confirmed' | 'Preparing' | 'On the Way' | 'Delivered';
    createdAt?: string | Date;
}
