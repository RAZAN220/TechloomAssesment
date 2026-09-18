/**
 * Product controller — thin handlers; business logic lives in productService.
 */
const productService = require('../services/productService');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    List products (search, filters, sort, pagination)
// @route   GET /api/products
// @access  Public
const listProducts = async (req, res, next) => {
  try {
    const result = await productService.listProducts(req.query);
    return sendSuccess(res, { data: result });
  } catch (err) {
    return next(err);
  }
};

// @desc    Distinct category list (for filter UI)
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories();
    return sendSuccess(res, { data: { categories } });
  } catch (err) {
    return next(err);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return sendSuccess(res, { data: { product } });
  } catch (err) {
    return next(err);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return sendSuccess(res, {
      status: 201,
      message: 'Product created',
      data: { product },
    });
  } catch (err) {
    return next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, { message: 'Product updated', data: { product } });
  } catch (err) {
    return next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    return sendSuccess(res, {
      message: 'Product deleted',
      data: { id: product._id },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listProducts,
  getCategories,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
