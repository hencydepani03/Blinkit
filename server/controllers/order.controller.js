const Order = require('../models/Order');
const Product = require('../models/Product');

// POST /api/orders
exports.create = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { items, subtotal, deliveryFee = 0, handlingFee = 0, total } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }
    if (subtotal == null || total == null) {
      return res.status(400).json({ message: 'subtotal and total are required' });
    }

    // Optionally adjust stock and accumulate sales
    for (const it of items) {
      if (it.product) {
        const p = await Product.findById(it.product);
        if (p) {
          p.stock = Math.max(0, p.stock - it.quantity);
          p.sales = (p.sales || 0) + it.quantity;
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
