import { Request, Response } from 'express';
import { Shop } from '../types';

export const createShop = async (req: Request, res: Response) => {
    try {
        const { shopName, shopType, address, city, latitude, longitude } = req.body;

        // Validations
        if (!shopName || shopName.length < 3) {
            return res.status(400).json({ success: false, error: 'Shop name must be at least 3 characters long.' });
        }

        if (!['Restaurant', 'Vegetables', 'Grocery'].includes(shopType)) {
            return res.status(400).json({ success: false, error: 'Invalid shop type.' });
        }

        if (!address || !latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Address and coordinates are required.' });
        }

        if (city !== 'Kakinada') {
            return res.status(400).json({ success: false, error: 'Shops can only be located in Kakinada.' });
        }

        const newShop: Shop = {
            id: Math.floor(Math.random() * 10000), // Note: Auto-generated from DB in real implementation
            shopName,
            shopType,
            address,
            city,
            latitude,
            longitude,
            createdAt: new Date().toISOString()
        };

        return res.status(201).json({
            success: true,
            message: 'Shop created successfully',
            shop: newShop
        });

    } catch (error) {
        console.error('Error creating shop:', error);
        return res.status(500).json({ success: false, error: 'Server error while creating shop' });
    }
};

export const getShops = async (req: Request, res: Response) => {
    try {
        // Return dummy implementation
        const shops: Shop[] = [];
        return res.status(200).json({ success: true, shops });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Server error while fetching shops' });
    }
};
