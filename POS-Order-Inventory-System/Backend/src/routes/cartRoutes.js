const express = require('express');
const router = express.Router();
const {
  createCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  getCart,
  deleteCart,
} = require('../controllers/cartController');

router.post('/', createCart);
router.post('/:cartId/items', addItemToCart);
router.put('/:cartId/items/:productId', updateCartItem);
router.delete('/:cartId/items/:productId', removeCartItem);
router.get('/:cartId', getCart);
router.delete('/:cartId', deleteCart);

module.exports = router;
