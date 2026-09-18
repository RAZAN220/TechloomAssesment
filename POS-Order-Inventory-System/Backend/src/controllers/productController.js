const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { validateProductPayload, isValidObjectId } = require('../utils/validators');

async function createProduct(req, res) {
  try {
    const error = validateProductPayload(req.body);
    if (error) return sendError(res, 400, error);

    const product = await Product.create(req.body);
    return sendSuccess(res, product, 201);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to create product');
  }
}

async function getProducts(req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return sendSuccess(res, products);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch products');
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, 'Invalid product id');

    const product = await Product.findById(id);
    if (!product) return sendError(res, 404, 'Product not found');

    return sendSuccess(res, product);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch product');
  }
}

async function getProductStock(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, 'Invalid product id');

    const product = await Product.findById(id);
    if (!product) return sendError(res, 404, 'Product not found');

    return sendSuccess(res, { productId: product._id, stock: product.stock });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch stock');
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, 'Invalid product id');

    const error = validateProductPayload(req.body);
    if (error) return sendError(res, 400, error);

    const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!product) return sendError(res, 404, 'Product not found');

    return sendSuccess(res, product);
  } catch (error) {
    return sendError(res, 500, 'Failed to update product');
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, 'Invalid product id');

    const activeReservation = await Order.exists({
      status: 'Reserved',
      'items.productId': id,
    });

    if (activeReservation) {
      return sendError(res, 409, 'Product cannot be deleted while it has a live stock reservation');
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) return sendError(res, 404, 'Product not found');

    return sendSuccess(res, { deleted: true, productId: id });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete product');
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductStock,
  updateProduct,
  deleteProduct,
};
