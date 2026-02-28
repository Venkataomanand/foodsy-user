import { Router } from 'express';
import { registerUser } from '../controllers/userController';
import { createOrder, getAdminOrders, updateOrderStatus } from '../controllers/orderController';
import { createShop, getShops } from '../controllers/shopController';

const router = Router();

// ==== USER ROUTES ====
router.post('/users/register', registerUser);

// ==== SHOP ROUTES ====
router.get('/shops', getShops);

// ==== ORDER ROUTES ====
// Create Order endpoint using checkout screens
router.post('/orders', createOrder);

// ==== ADMIN ROUTES ====
// Shop additions
router.post('/admin/shops', createShop);

// Panel data fetching for ALL relational records
router.get('/admin/orders', getAdminOrders);

// Panel functionality to update specific statuses (Confirmed -> Preparing, etc)
router.patch('/admin/orders/:orderId', updateOrderStatus);

export default router;
