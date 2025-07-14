-- ============================================
-- STOCK MANAGEMENT DATABASE SCHEMA
-- Separated Restock and Sales Transactions
-- ============================================

-- Products Table (unchanged)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    purchase_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SALES TRANSACTIONS (Customer Sales)
-- ============================================
CREATE TABLE IF NOT EXISTS sales_transactions (
    sales_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_profit DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash',
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS sales_items (
    sales_item_id SERIAL PRIMARY KEY,
    sales_id INTEGER REFERENCES sales_transactions(sales_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    purchase_price_at_sale DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    item_profit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- RESTOCK TRANSACTIONS (Inventory Restocking)
-- ============================================
CREATE TABLE IF NOT EXISTS restock_transactions (
    restock_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255),
    total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    restock_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    invoice_number VARCHAR(100),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS restock_items (
    restock_item_id SERIAL PRIMARY KEY,
    restock_id INTEGER REFERENCES restock_transactions(restock_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STOCK HISTORY (Combined for both)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL, -- 'SALE', 'RESTOCK', 'ADJUSTMENT'
    quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_type VARCHAR(20), -- 'SALES', 'RESTOCK'
    reference_id INTEGER, -- sales_id or restock_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_restock_date ON restock_transactions (restock_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements (created_at);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Update products.updated_at when modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Sample Products

