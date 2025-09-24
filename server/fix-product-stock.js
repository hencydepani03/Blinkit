const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blink-shop-now', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixProductStock() {
  try {
    console.log('Checking for products with invalid stock values...');
    
    const products = await Product.find({});
    let fixedCount = 0;
    
    for (const product of products) {
      const currentStock = Number(product.stock);
      const currentSales = Number(product.sales);
      
      if (isNaN(currentStock)) {
        console.log(`Fixing stock for product: ${product.name} (was: ${product.stock})`);
        product.stock = 0;
        fixedCount++;
      }
      
      if (isNaN(currentSales)) {
        console.log(`Fixing sales for product: ${product.name} (was: ${product.sales})`);
        product.sales = 0;
        fixedCount++;
      }
      
      if (fixedCount > 0) {
        await product.save();
      }
    }
    
    console.log(`Fixed ${fixedCount} invalid stock/sales values.`);
    console.log('All products now have valid stock and sales values.');
    
    // Display current products
    const updatedProducts = await Product.find({});
    console.log('\nCurrent products:');
    updatedProducts.forEach(p => {
      console.log(`- ${p.name}: stock=${p.stock}, sales=${p.sales}`);
    });
    
  } catch (error) {
    console.error('Error fixing product stock:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixProductStock();
