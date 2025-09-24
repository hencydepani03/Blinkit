const router = require('express').Router();
const auth = require('../utils/auth.middleware');
const isAdmin = require('../utils/admin.middleware');
const { create, list, updateStatus, myOrders, updateByUser } = require('../controllers/order.controller');

// Create order (user)
router.post('/', auth, create);

// List all orders (admin)
router.get('/', auth, isAdmin, list);

// Update order status (admin)
router.patch('/:id/status', auth, isAdmin, updateStatus);

// List current user's orders
router.get('/my', auth, myOrders);

// Update own order if pending
router.patch('/:id', auth, updateByUser);

module.exports = router;
