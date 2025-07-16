const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all transactions (combined from sales and restock)
router.get('/', async (req, res) => {
  try {
    // Get sales transactions with items
    const salesQuery = `
      SELECT 
        'SALE' as transaction_type,
        st.sales_id as transaction_id,
        st.customer_name,
        st.total_amount,
        st.total_profit,
        st.transaction_date,
        st.notes,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'product_name', p.name,
              'quantity', si.quantity,
              'unit_price', si.unit_price,
              'subtotal', si.subtotal,
              'product_id', si.product_id
            ) ORDER BY si.sales_item_id
          ) FILTER (WHERE si.sales_item_id IS NOT NULL),
          '[]'::json
        ) as items
      FROM sales_transactions st
      LEFT JOIN sales_items si ON st.sales_id = si.sales_id
      LEFT JOIN products p ON si.product_id = p.id
      GROUP BY st.sales_id, st.customer_name, st.total_amount, st.total_profit, st.transaction_date, st.notes
    `;
    
    // Get restock transactions with items
    const restockQuery = `
      SELECT 
        'RESTOCK' as transaction_type,
        rt.restock_id as transaction_id,
        rt.supplier_name as customer_name,
        rt.total_cost as total_amount,
        0 as total_profit,
        rt.restock_date as transaction_date,
        rt.notes,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'product_name', p.name,
              'quantity', ri.quantity,
              'unit_price', ri.unit_cost,
              'subtotal', ri.subtotal,
              'product_id', ri.product_id
            ) ORDER BY ri.restock_item_id
          ) FILTER (WHERE ri.restock_item_id IS NOT NULL),
          '[]'::json
        ) as items
      FROM restock_transactions rt
      LEFT JOIN restock_items ri ON rt.restock_id = ri.restock_id
      LEFT JOIN products p ON ri.product_id = p.id
      GROUP BY rt.restock_id, rt.supplier_name, rt.total_cost, rt.restock_date, rt.notes
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
