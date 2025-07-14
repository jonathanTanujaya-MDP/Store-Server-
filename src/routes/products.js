const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all products
router.get('/', async (req, res) => {
  try {
    const allProducts = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(allProducts.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (product.rows.length === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new product
router.post('/', async (req, res) => {
  try {
    const { name, purchase_price, selling_price, stock_quantity, minimum_stock, category } = req.body;
    const newProduct = await pool.query(
      'INSERT INTO products (name, purchase_price, selling_price, stock_quantity, minimum_stock, category) VALUES($1, $2, $3, $4, $5, $6) RETURNING * ',
      [name, purchase_price, selling_price, stock_quantity, minimum_stock, category]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, purchase_price, selling_price, stock_quantity, minimum_stock, category } = req.body;
    const updateProduct = await pool.query(
      'UPDATE products SET name = $1, purchase_price = $2, selling_price = $3, stock_quantity = $4, minimum_stock = $5, category = $6 WHERE id = $7 RETURNING * ',
      [name, purchase_price, selling_price, stock_quantity, minimum_stock, category, id]
    );
    if (updateProduct.rows.length === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(updateProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteProduct = await pool.query('DELETE FROM products WHERE id = $1 RETURNING * ', [id]);
    if (deleteProduct.rows.length === 0) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json({ msg: 'Product deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
