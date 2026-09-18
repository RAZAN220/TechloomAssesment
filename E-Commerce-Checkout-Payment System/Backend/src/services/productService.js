/**
 * Product service — catalog querying and admin product management.
 * All prices are integer minor units (cents) internally; the API accepts
 * decimal major units (dollars) and converts deterministically via rounding.
 */
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { ApiError } = require('../utils/apiResponse');

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const dollarsToCents = (value) => Math.round(parseFloat(value) * 100);

const SORT_MAP = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

const buildQuery = ({ search, category, minPrice, maxPrice, inStock }) => {
  const query = {};

  if (search && String(search).trim()) {
    const escaped = escapeRegExp(String(search).trim());
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (category && String(category).trim()) {
    query.category = { $regex: `^${escapeRegExp(String(category).trim())}$`, $options: 'i' };
  }

  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    priceFilter.$gte = dollarsToCents(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    priceFilter.$lte = dollarsToCents(maxPrice);
  }
  if (Object.keys(priceFilter).length > 0) {
    query.price = priceFilter;
  }

  if (inStock === true || inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  return query;
};

// @returns { products, pagination }
const listProducts = async (options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 12));
  const sort = SORT_MAP[options.sortBy] || SORT_MAP.newest;

  const query = buildQuery(options);

  const [products, total] = await Promise.all([
    Product.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

const getProductById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid product id');
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return product;
};

const getCategories = async () => {
  const categories = await Product.distinct('category');
  return categories.sort((a, b) => a.localeCompare(b));
};

const createProduct = async (payload) => {
  const product = await Product.create({
    name: payload.name,
    description: payload.description,
    category: payload.category,
    price: dollarsToCents(payload.price),
    image: payload.image || '',
    stock: parseInt(payload.stock, 10),
  });
  return product;
};

const updateProduct = async (id, payload) => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid product id');
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.category !== undefined) updates.category = payload.category;
  if (payload.image !== undefined) updates.image = payload.image;
  if (payload.price !== undefined) updates.price = dollarsToCents(payload.price);
  if (payload.stock !== undefined) updates.stock = parseInt(payload.stock, 10);

  const product = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return product;
};

const deleteProduct = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid product id');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  await product.deleteOne();

  // Best-effort cleanup: drop the product from every user's cart.
  // Orders are unaffected — they store immutable snapshots.
  await Cart.updateMany({}, { $pull: { items: { product: product._id } } });

  return product;
};

module.exports = {
  listProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  dollarsToCents,
};
