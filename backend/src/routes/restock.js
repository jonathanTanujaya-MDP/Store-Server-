const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all restock transactions
router.get('/', async (req, res) => {
  try {
    const allRestocks = await pool.query('SELECT * FROM restock_transactions ORDER BY restock_date DESC');
    res.json(allRestocks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new restock transaction (multi-item support)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { supplier_name, items } = req.body; // transaction_type is implicitly 'IN' for restock
    let total_cost = 0;

    await client.query('BEGIN');

    // 1. Insert into restock_transactions table
    const newRestock = await client.query(
      'INSERT INTO restock_transactions (supplier_name) VALUES($1) RETURNING * ',
      [supplier_name]
    );
    const restockId = newRestock.rows[0].restock_id;

    // 2. Process each item in the restock transaction
    for (const item of items) {
      const { product_id, quantity, unit_cost } = item;

      // Get product details (stock, etc.)
      const product = await client.query('SELECT * FROM products WHERE id = $1', [product_id]);
      if (product.rows.length === 0) {
        throw new Error(`Product with ID ${product_id} not found.`);
      }
      const { stock_quantity } = product.rows[0];

      // Calculate subtotal
      const subtotal = unit_cost * quantity;
      total_cost += subtotal;

      // Insert into restock_items table
      await client.query(
        'INSERT INTO restock_items (restock_id, product_id, quantity, unit_cost, subtotal) VALUES($1, $2, $3, $4, $5)',
        [restockId, product_id, quantity, unit_cost, subtotal]
      );

      // Update product stock
      const newStock = stock_quantity + quantity;
      await client.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [newStock, product_id]);

      // Insert into stock_movements
      await client.query(
        'INSERT INTO stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id, reference_type) VALUES($1, $2, $3, $4, $5, $6, $7)',
        [product_id, 'RESTOCK', quantity, stock_quantity, newStock, restockId, 'RESTOCK']
      );
    }

    // 3. Update total_cost in restock_transactions table
    await client.query(
      'UPDATE restock_transactions SET total_cost = $1 WHERE restock_id = $2',
      [total_cost, restockId]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Restock transaction completed successfully', restock: newRestock.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing restock transaction:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Clear all restock transactions
router.delete('/clear', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete from restock_items (due to foreign key constraints)
    await client.query('DELETE FROM restock_items');
    // Note: stock_movements related to restocks will remain unless explicitly cleared or handled by cascade delete
    // Delete from restock_transactions
    await client.query('DELETE FROM restock_transactions');

    await client.query('COMMIT');
    res.status(200).json({ message: 'All restock history cleared successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing restock history:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;