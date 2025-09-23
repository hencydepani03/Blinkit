const Product = require('../models/Product');

// GET /api/products
exports.list = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// POST /api/products
exports.create = async (req, res) => {
  try {
    const { name, category, price, stock, unit, description = '', image = '/api/placeholder/80/80' } = req.body;

    if (!name || !category || price == null || stock == null || !unit) {
      return res.status(400).json({ message: 'name, category, price, stock, unit are required' });
    }

    const product = await Product.create({ name, category, price, stock, unit, description, image });
    res.status(201).json({ product: product.toJSON() });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// DELETE /api/products/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Product.findById(id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    await existing.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};
