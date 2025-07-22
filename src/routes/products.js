const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireOwner } = require('../middleware/auth');
const { validateProduct, validateId } = require('../middleware/validation');

// Get all products (accessible by both admin and owner)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT id, name, category, selling_price, stock_quantity';
    
    // Only owner can see purchase price (sensitive data)
    if (req.user.role === 'owner') {
      query += ', purchase_price';
    }
    
    query += ' FROM products ORDER BY id DESC';
    
    const allProducts = await pool.query(query);
    
    res.json({
      products: allProducts.rows,
      userRole: req.user.role,
      canSeePurchasePrice: req.user.role === 'owner'
    });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({
      error: 'Failed to fetch products'
    });
  }
});

// Get a single product (accessible by both admin and owner)
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = 'SELECT id, name, category, selling_price, stock_quantity';
    
    // Only owner can see purchase price
    if (req.user.role === 'owner') {
      query += ', purchase_price';
    }
    
    query += ' FROM products WHERE id = $1';
    
    const product = await pool.query(query, [id]);
    
    if (product.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    
    res.json({
      product: product.rows[0],
      userRole: req.user.role,
      canSeePurchasePrice: req.user.role === 'owner'
    });
  } catch (err) {
    console.error('Error fetching product:', err.message);
    res.status(500).json({
      error: 'Failed to fetch product'
    });
  }
});

// Add a new product (admin and owner)
router.post('/', authenticateToken, validateProduct, async (req, res) => {
  try {
    const { name, purchase_price, selling_price, stock_quantity, minimum_stock, category } = req.body;
    
    const newProduct = await pool.query(
      'INSERT INTO products (name, purchase_price, selling_price, stock_quantity, minimum_stock, category) VALUES($1, $2, $3, $4, $5, $6) RETURNING * ',
      [name, purchase_price, selling_price, stock_quantity, minimum_stock || 5, category || 'General']
    );
    
    // Log the action
    console.log(`✅ Product created: ${name} by ${req.user.username} (${req.user.role})`);
    
    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct.rows[0],
      createdBy: req.user.username
    });
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({
      error: 'Failed to create product'
    });
  }
});

// Update a product (admin and owner)
router.put('/:id', authenticateToken, validateId, validateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, purchase_price, selling_price, stock_quantity, minimum_stock, category } = req.body;
    
    const updateProduct = await pool.query(
      'UPDATE products SET name = $1, purchase_price = $2, selling_price = $3, stock_quantity = $4, minimum_stock = $5, category = $6 WHERE id = $7 RETURNING * ',
      [name, purchase_price, selling_price, stock_quantity, minimum_stock || 5, category || 'General', id]
    );
    
    if (updateProduct.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    
    // Log the action
    console.log(`✅ Product updated: ID ${id} by ${req.user.username} (${req.user.role})`);
    
    res.json({
      message: 'Product updated successfully',
      product: updateProduct.rows[0],
      updatedBy: req.user.username
    });
  } catch (err) {
    console.error('Error updating product:', err.message);
    res.status(500).json({
      error: 'Failed to update product'
    });
  }
});

// Delete a product (OWNER ONLY)
router.delete('/:id', authenticateToken, requireOwner, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, get the product details for logging
    const productCheck = await pool.query('SELECT name FROM products WHERE id = $1', [id]);
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    
    const deleteProduct = await pool.query('DELETE FROM products WHERE id = $1 RETURNING * ', [id]);
    
    // Log the action
    console.log(`🗑️ Product deleted: ${productCheck.rows[0].name} (ID: ${id}) by ${req.user.username}`);
    
    res.json({ 
      message: 'Product deleted successfully',
      deletedProduct: deleteProduct.rows[0],
      deletedBy: req.user.username
    });
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).json({
      error: 'Failed to delete product'
    });
  }
});

module.exports = router;
