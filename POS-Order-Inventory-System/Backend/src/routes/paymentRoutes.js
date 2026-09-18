const express = require('express');
const router = express.Router();
const { processOrderPayment, getPaymentStatus } = require('../controllers/paymentController');

router.post('/', processOrderPayment);
router.get('/:orderId', getPaymentStatus);

module.exports = router;
