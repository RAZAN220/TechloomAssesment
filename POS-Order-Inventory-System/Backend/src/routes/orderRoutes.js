const express = require('express');
const router = express.Router();
const { createCheckoutOrder, getOrders, getOrderById, cancelOrder } = require('../controllers/orderController');

router.post('/checkout', createCheckoutOrder);
router.get('/', getOrders);
router.get('/:orderId', getOrderById);
router.post('/:orderId/cancel', cancelOrder);

module.exports = router;
