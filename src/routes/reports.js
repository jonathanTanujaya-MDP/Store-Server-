const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireOwner } = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

// Get financial reports (OWNER ONLY) - sensitive data
router.get('/financial', authenticateToken, requireOwner, validateDateRange, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (start_date && end_date) {
      whereClause = 'WHERE s.transaction_date >= $1 AND s.transaction_date <= $2';
      params = [start_date, end_date];
    } else if (start_date) {
      whereClause = 'WHERE s.transaction_date >= $1';
      params = [start_date];
    } else if (end_date) {
      whereClause = 'WHERE s.transaction_date <= $1';
      params = [end_date];
    }
    
    // Get sales with profit calculation
    const salesQuery = `
      SELECT 
        s.id,
        s.customer_name,
        s.transaction_date,
        s.total_amount,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'product_name', p.name,
            'quantity', si.quantity,
            'selling_price', si.unit_price,
            'purchase_price', p.purchase_price,
            'profit_per_item', (si.unit_price - p.purchase_price),
            'total_profit', (si.unit_price - p.purchase_price) * si.quantity
          )
        ) as items
      FROM sales s
      LEFT JOIN sales_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      ${whereClause}
      GROUP BY s.id, s.customer_name, s.transaction_date, s.total_amount
      ORDER BY s.transaction_date DESC
    `;
    
    const salesResult = await pool.query(salesQuery, params);
    
    // Calculate totals
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    
    salesResult.rows.forEach(sale => {
      totalRevenue += parseFloat(sale.total_amount);
      
      sale.items.forEach(item => {
        if (item.purchase_price && item.quantity) {
          const itemCost = item.purchase_price * item.quantity;
          totalCost += itemCost;
          totalProfit += (item.total_profit || 0);
        }
      });
    });
    
    // Get product performance
    const productPerformanceQuery = `
      SELECT 
        p.name,
        p.purchase_price,
        p.selling_price,
        SUM(si.quantity) as total_sold,
        SUM(si.quantity * si.unit_price) as total_revenue,
        SUM(si.quantity * p.purchase_price) as total_cost,
        SUM(si.quantity * (si.unit_price - p.purchase_price)) as total_profit
      FROM products p
      LEFT JOIN sales_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id
      ${whereClause.replace('s.transaction_date', 's.transaction_date')}
      GROUP BY p.id, p.name, p.purchase_price, p.selling_price
      HAVING SUM(si.quantity) > 0
      ORDER BY total_profit DESC
    `;
    
    const productPerformance = await pool.query(productPerformanceQuery, params);
    
    // Log access
    console.log(`📊 Financial report accessed by ${req.user.username} at ${new Date().toISOString()}`);
    
    res.json({
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
        transactionCount: salesResult.rows.length
      },
      sales: salesResult.rows,
      productPerformance: productPerformance.rows,
      dateRange: {
        start: start_date || 'All time',
        end: end_date || 'All time'
      },
      generatedBy: req.user.username,
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error generating financial report:', err.message);
    res.status(500).json({
      error: 'Failed to generate financial report'
    });
  }
});

// Get inventory report (accessible by admin and owner)
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const inventoryQuery = `
      SELECT 
        id,
        name,
        category,
        stock_quantity,
        minimum_stock,
        selling_price,
        ${req.user.role === 'owner' ? 'purchase_price,' : ''}
        CASE 
          WHEN stock_quantity <= minimum_stock THEN 'Low Stock'
          WHEN stock_quantity = 0 THEN 'Out of Stock'
          ELSE 'Normal'
        END as stock_status
      FROM products
      ORDER BY 
        CASE 
          WHEN stock_quantity = 0 THEN 1
          WHEN stock_quantity <= minimum_stock THEN 2
          ELSE 3
        END,
        name
    `;
    
    const inventoryResult = await pool.query(inventoryQuery);
    
    // Calculate inventory statistics
    const stats = {
      totalProducts: inventoryResult.rows.length,
      outOfStock: inventoryResult.rows.filter(p => p.stock_quantity === 0).length,
      lowStock: inventoryResult.rows.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.minimum_stock).length,
      normalStock: inventoryResult.rows.filter(p => p.stock_quantity > p.minimum_stock).length,
      totalStockValue: 0
    };
    
    if (req.user.role === 'owner') {
      stats.totalStockValue = inventoryResult.rows.reduce((total, product) => {
        return total + (product.purchase_price * product.stock_quantity);
      }, 0);
    }
    
    res.json({
      statistics: stats,
      products: inventoryResult.rows,
      userRole: req.user.role,
      generatedBy: req.user.username,
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error generating inventory report:', err.message);
    res.status(500).json({
      error: 'Failed to generate inventory report'
    });
  }
});

module.exports = router;
