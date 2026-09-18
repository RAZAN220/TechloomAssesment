const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  getProductStock,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id/stock', getProductStock);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
