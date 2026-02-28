import { Request, Response } from 'express';
import { generateOrderId } from '../utils/generators';
import { validateCheckoutData } from '../utils/validation';
import { Order } from '../types';

let dailyOrderSequence = 1;

export const createOrder = async (req: Request, res: Response) => {
    try {
        // Exact 10-digit mobile number validations and items checking
        const validation = validateCheckoutData(req.body);
        if (validation.error) {
            return res.status(400).json({ success: false, error: validation.error });
        }

        const { userId, mobileNumber, cartItems, subtotal, deliveryFee } = req.body;
        const totalAmount = subtotal + deliveryFee;

        const orderId = generateOrderId(dailyOrderSequence++);

        const newOrder: Order = {
            orderId,
            userId,
            mobileNumber,
            cartItems,
            subtotal,
            deliveryFee,
            totalAmount,
            status: 'Confirmed',
            createdAt: new Date().toISOString()
        };

        // Database Insertion simulation here
        // Example: await db.query('INSERT INTO Orders ...', [...]);

        res.status(201).json({
            success: true,
            message: 'Order created successfully!',
            order: newOrder
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error creating order' });
    }
};

export const getAdminOrders = async (req: Request, res: Response) => {
    try {
        // Database connection simulation fetching relational data between Users AND Orders based on userId
        /* 
        SELECT o.*, u.username, u.email, u.address, u.city 
        FROM Orders o 
        JOIN Users u ON o.userId = u.userId 
        ORDER BY o.createdAt DESC
        */
        const mockOrders: any[] = [];
        res.status(200).json({ success: true, orders: mockOrders });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!['Confirmed', 'Preparing', 'On the Way', 'Delivered'].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status state" });
        }

        // Database mapping
        // await db.query('UPDATE Orders SET status = $1 WHERE orderId = $2', [status, orderId]);

        res.status(200).json({ success: true, message: `Order ${orderId} successfully mutated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to toggle order status update.' });
    }
};
