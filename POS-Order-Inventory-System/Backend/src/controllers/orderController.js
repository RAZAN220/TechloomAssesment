const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { isValidObjectId } = require('../utils/validators');
const {
  cancelReservedOrder,
  createHttpError,
  releaseOrderStock,
  reserveStockForOrder,
  withTransaction,
} = require('../services/inventoryService');

function buildOrderNumber() {
  return `ORD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

function buildOrderItem(product, quantity) {
  const unitPrice = Number(product.price);
  return {
    productId: product._id,
    name: product.name,
    price: unitPrice,
    quantity,
    subtotal: unitPrice * quantity,
  };
}

function queryWithSession(query, session) {
  return session ? query.session(session) : query;
}

function optionsWithSession(options, session) {
  return session ? { ...options, session } : options;
}

async function createCheckoutOrder(req, res) {
  const { cartId } = req.body;

  if (!cartId || typeof cartId !== 'string') {
    return sendError(res, 400, 'Cart id is required');
  }

  try {
    const createdOrder = await withTransaction(async (session) => {
      let cart;
      let reservedStock = false;
      let savedOrder;

      try {
        // This update claims a cart once. A concurrent submission cannot move
        // the same cart from active to checking_out twice.
        cart = await Cart.findOneAndUpdate(
          { cartId, status: 'active' },
          { $set: { status: 'checking_out' } },
          optionsWithSession({ new: true }, session)
        );

        if (!cart) {
          const knownCart = await queryWithSession(Cart.findOne({ cartId }), session);
          if (!knownCart) throw createHttpError('Cart not found', 404);
          throw createHttpError('This cart has already been submitted for checkout.', 409);
        }

        if (!Array.isArray(cart.items) || cart.items.length === 0) {
          throw createHttpError('Cart is empty', 400);
        }

        const orderItems = [];

        for (const cartItem of cart.items) {
          const quantity = Number(cartItem.quantity);
          if (!Number.isInteger(quantity) || quantity <= 0) {
            throw createHttpError('Cart contains an invalid item quantity', 400);
          }

          const product = await queryWithSession(Product.findById(cartItem.productId), session);
          if (!product) {
            throw createHttpError(`Product ${String(cartItem.productId)} not found`, 404);
          }

          orderItems.push(buildOrderItem(product, quantity));
        }

        // Product values are re-read at checkout; a cart never reserves or
        // trusts stock captured when an item was first added.
        await reserveStockForOrder({ items: orderItems }, session);
        reservedStock = true;

        const now = new Date();
        const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        const order = new Order({
          orderNumber: buildOrderNumber(),
          cartId,
          items: orderItems,
          totalAmount,
          status: 'Reserved',
          reservationExpiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          paymentStatus: 'pending',
        });

        await order.save(optionsWithSession({}, session));
        savedOrder = order;

        cart.status = 'checked_out';
        cart.checkoutOrderId = order._id;
        await cart.save(optionsWithSession({}, session));

        return order;
      } catch (error) {
        // The normal path is transactional. This compensation path supports a
        // standalone local MongoDB, where sessions cannot start transactions.
        if (!session) {
          if (savedOrder) await Order.deleteOne({ _id: savedOrder._id });
          if (reservedStock && cart) await releaseOrderStock({ items: cart.items });
          if (cart) {
            await Cart.updateOne(
              { _id: cart._id, status: 'checking_out' },
              { $set: { status: 'active' } }
            );
          }
        }
        throw error;
      }
    });

    return sendSuccess(res, createdOrder, 201);
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, 409, 'This cart has already been submitted for checkout.');
    }
    return sendError(res, error.statusCode || 500, error.message || 'Checkout failed');
  }
}

async function getOrders(req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return sendSuccess(res, orders);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch orders');
  }
}

async function getOrderById(req, res) {
  try {
    const { orderId } = req.params;
    if (!isValidObjectId(orderId)) return sendError(res, 400, 'Invalid order id');

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, 404, 'Order not found');
    return sendSuccess(res, order);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch order');
  }
}

async function cancelOrder(req, res) {
  try {
    const { orderId } = req.params;
    if (!isValidObjectId(orderId)) return sendError(res, 400, 'Invalid order id');

    const order = await cancelReservedOrder(orderId);
    return sendSuccess(res, order);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Order cancellation failed');
  }
}

module.exports = {
  createCheckoutOrder,
  getOrders,
  getOrderById,
  cancelOrder,
};
