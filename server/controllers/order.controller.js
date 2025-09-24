const Order = require('../models/Order');
const Product = require('../models/Product');

// POST /api/orders
exports.create = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { items, subtotal, deliveryFee = 0, handlingFee = 0, total, customerName, phone, address, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }
    if (subtotal == null || total == null) {
      return res.status(400).json({ message: 'subtotal and total are required' });
    }

    // Basic customer validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({ message: 'Valid customer name is required' });
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      return res.status(400).json({ message: 'Valid phone is required' });
    }
    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return res.status(400).json({ message: 'Valid address is required' });
    }
    if (paymentMethod !== 'COD') {
      return res.status(400).json({ message: 'Only Cash on Delivery (COD) is supported right now' });
    }

    // Validate each item in the order
    for (const item of items) {
      if (!item.name || !item.price || !item.quantity) {
        return res.status(400).json({ message: 'Each item must have name, price, and quantity' });
      }
      if (isNaN(Number(item.price)) || isNaN(Number(item.quantity))) {
        return res.status(400).json({ message: 'Item price and quantity must be valid numbers' });
      }
      if (Number(item.quantity) <= 0) {
        return res.status(400).json({ message: 'Item quantity must be greater than 0' });
      }
    }

    // Optionally adjust stock and accumulate sales
    for (const it of items) {
      if (it.product) {
        const p = await Product.findById(it.product);
        if (p) {
          // Validate quantities and coerce invalid stock to 0
          const orderQuantity = Number(it.quantity);
          if (isNaN(orderQuantity) || orderQuantity <= 0) {
            console.error(`Invalid quantity for order item. productId=${it.product}, quantity=${it.quantity}`);
            return res.status(400).json({ message: `Invalid quantity for product ${p.name}` });
          }

          let currentStock = Number(p.stock);
          if (isNaN(currentStock)) {
            console.warn(`Coercing invalid stock to 0 for product ${p.name}. rawStock=${p.stock}`);
            currentStock = 0;
          }

          p.stock = Math.max(0, currentStock - orderQuantity);
          const currentSales = Number(p.sales);
          p.sales = (isNaN(currentSales) ? 0 : currentSales) + orderQuantity;
          await p.save();
        }
      }
    }

    const order = await Order.create({
      user: userId,
      items,
      subtotal,
      deliveryFee,
      handlingFee,
      total,
      customerName,
      phone,
      address,
      paymentMethod: 'COD',
      status: 'pending'
    });

    return res.status(201).json({ order: order.toJSON() });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ message: 'Failed to create order' });
  }
};

// GET /api/orders (admin only)
exports.list = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');
    return res.json({ orders });
  } catch (err) {
    console.error('List orders error:', err);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// PATCH /api/orders/:id/status (admin only)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    await order.save();
    return res.json({ order: order.toJSON() });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
};

// GET /api/orders/my (user only)
exports.myOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({ orders: orders.map(o => o.toJSON()) });
  } catch (err) {
    console.error('My orders error:', err);
    return res.status(500).json({ message: 'Failed to fetch your orders' });
  }
};

// PATCH /api/orders/:id (user only, edit pending orders)
exports.updateByUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be edited' });
    }

    // Allow updating items and recalculated totals OR allow user to cancel
    const { items, subtotal, deliveryFee, handlingFee, total, status } = req.body || {};

    if (status && status === 'cancelled') {
      order.status = 'cancelled';
    } else if (Array.isArray(items) && items.length > 0 && subtotal != null && total != null) {
      order.items = items;
      if (deliveryFee != null) order.deliveryFee = deliveryFee;
      if (handlingFee != null) order.handlingFee = handlingFee;
      order.subtotal = subtotal;
      order.total = total;
    } else {
      return res.status(400).json({ message: 'Provide valid update payload (either status=cancelled or items with totals)' });
    }

    await order.save();
    return res.json({ order: order.toJSON() });
  } catch (err) {
    console.error('Update my order error:', err);
    return res.status(500).json({ message: 'Failed to update order' });
  }
};

