const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all sales transactions
router.get('/', async (req, res) => {
  try {
    const allSales = await pool.query('SELECT * FROM sales_transactions ORDER BY transaction_date DESC');
    res.json(allSales.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new sales transaction (multi-item support)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { customer_name, items } = req.body; // transaction_type is implicitly 'OUT' for sales
    let total_amount = 0;
    let total_profit = 0;

    await client.query('BEGIN');

    // 1. Insert into sales_transactions table
    const newSale = await client.query(
      'INSERT INTO sales_transactions (customer_name) VALUES($1) RETURNING * ',
      [customer_name]
    );
    const salesId = newSale.rows[0].sales_id;

    // 2. Process each item in the sales transaction
    for (const item of items) {
      const { product_id, quantity } = item;

      // Get product details (price, stock, etc.)
      const product = await client.query('SELECT * FROM products WHERE id = $1', [product_id]);
      if (product.rows.length === 0) {
        throw new Error(`Product with ID ${product_id} not found.`);
      }
      const { stock_quantity, selling_price, purchase_price } = product.rows[0];

      // Check stock for 'OUT' transactions
      if (stock_quantity < quantity) {
        throw new Error(`Insufficient stock for product ${product.rows[0].name}. Available: ${stock_quantity}, Requested: ${quantity}`);
      }

      // Calculate item profit and amount
      const itemProfit = (selling_price - purchase_price) * quantity;
      const subtotal = selling_price * quantity;

      total_amount += subtotal;
      total_profit += itemProfit;

      // Insert into sales_items table
      await client.query(
        'INSERT INTO sales_items (sales_id, product_id, quantity, unit_price, purchase_price_at_sale, subtotal, item_profit) VALUES($1, $2, $3, $4, $5, $6, $7)',
        [salesId, product_id, quantity, selling_price, purchase_price, subtotal, itemProfit]
      );

      // Update product stock
      const newStock = stock_quantity - quantity;
      await client.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [newStock, product_id]);

      // Insert into stock_movements
      await client.query(
        'INSERT INTO stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id, reference_type) VALUES($1, $2, $3, $4, $5, $6, $7)',
        [product_id, 'SALE', -quantity, stock_quantity, newStock, salesId, 'SALE']
      );
    }

    // 3. Update total_amount and total_profit in sales_transactions table
    await client.query(
      'UPDATE sales_transactions SET total_amount = $1, total_profit = $2 WHERE sales_id = $3',
      [total_amount, total_profit, salesId]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Sales transaction completed successfully', sales: newSale.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing sales transaction:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Clear all sales transactions
router.delete('/clear', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete from sales_items (due to foreign key constraints)
    await client.query('DELETE FROM sales_items');
    // Note: stock_movements related to sales will remain unless explicitly cleared or handled by cascade delete
    // Delete from sales_transactions
    await client.query('DELETE FROM sales_transactions');

    await client.query('COMMIT');
    res.status(200).json({ message: 'All sales history cleared successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing sales history:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;