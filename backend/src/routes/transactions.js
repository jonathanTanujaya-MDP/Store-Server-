const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all transactions (combined from sales and restock)
router.get('/', async (req, res) => {
  try {
    // Get sales transactions
    const salesQuery = `
      SELECT 
        'SALE' as transaction_type,
        sales_id as transaction_id,
        customer_name,
        total_amount,
        total_profit,
        transaction_date,
        notes
      FROM sales_transactions
    `;
    
    // Get restock transactions
    const restockQuery = `
      SELECT 
        'RESTOCK' as transaction_type,
        restock_id as transaction_id,
        supplier_name as customer_name,
        total_cost as total_amount,
        0 as total_profit,
        restock_date as transaction_date,
        notes
      FROM restock_transactions
    `;
    
    // Combine both queries
    const combinedQuery = `
      (${salesQuery})
      UNION ALL
      (${restockQuery})
      ORDER BY transaction_date DESC
    `;
    
    const allTransactions = await pool.query(combinedQuery);
    res.json(allTransactions.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Legacy endpoint - redirect to appropriate endpoint
router.post('/', async (req, res) => {
  try {
    const { transaction_type } = req.body;
    
    if (transaction_type === 'OUT' || transaction_type === 'SALE') {
      return res.status(400).json({ 
        error: 'Please use /api/sales endpoint for sales transactions',
        redirect: '/api/sales'
      });
    } else if (transaction_type === 'IN' || transaction_type === 'RESTOCK') {
      return res.status(400).json({ 
        error: 'Please use /api/restock endpoint for restock transactions',
        redirect: '/api/restock'
      });
    } else {
      return res.status(400).json({ 
        error: 'Invalid transaction type. Use /api/sales or /api/restock endpoints'
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Clear all transactions (both sales and restock)
router.delete('/clear', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete from sales_items and sales_transactions
    await client.query('DELETE FROM sales_items');
    await client.query('DELETE FROM sales_transactions');
    
    // Delete from restock_items and restock_transactions
    await client.query('DELETE FROM restock_items');
    await client.query('DELETE FROM restock_transactions');
    
    // Delete stock movements
    await client.query('DELETE FROM stock_movements');

    await client.query('COMMIT');
    res.status(200).json({ message: 'All transaction history cleared successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing transaction history:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
