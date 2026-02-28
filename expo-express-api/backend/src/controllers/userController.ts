import { Request, Response } from 'express';
import { generateUserId } from '../utils/generators';
import { User } from '../types';

// Mock sequence representation - in production, retrieve max daily from DB
let dailyUserSequence = 1;

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, address, city, latitude, longitude } = req.body;

        // Generate custom User ID correctly according to specs
        const userId = generateUserId(username, dailyUserSequence++);

        const newUser: User = {
            userId,
            username,
            email,
            address,
            city,
            latitude,
            longitude,
            createdAt: new Date().toISOString()
        };

        // Database integration would go here
        // Example: await db.query('INSERT INTO Users (userId, username, email, address, city, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7)', [newUser.userId, ...]);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during registration' });
    }
};
