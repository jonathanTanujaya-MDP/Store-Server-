-- SCRIPT UNTUK MEMBUAT TABEL DI DATABASE store-db
-- Jalankan setelah database store-db sudah dibuat
-- psql -U store_admin -d store-db

-- Products Table
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

-- Sales Transactions
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

-- Restock Transactions
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

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_type VARCHAR(20),
    reference_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_restock_date ON restock_transactions (restock_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements (created_at);

-- Trigger untuk auto-update timestamp
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

-- Sample data untuk testing
INSERT INTO products (name, category, purchase_price, selling_price, stock_quantity, minimum_stock) VALUES
('Laptop Dell Inspiron', 'Electronics', 8000000, 10000000, 10, 5),
('Mouse Wireless Logitech', 'Electronics', 150000, 200000, 25, 10),
('Keyboard Gaming Mechanical', 'Electronics', 750000, 1000000, 15, 8),
('Monitor 24 inch Samsung', 'Electronics', 2500000, 3200000, 8, 3),
('Headphone Gaming Razer', 'Electronics', 500000, 750000, 20, 10),
('Smartphone Samsung A54', 'Electronics', 4500000, 5500000, 12, 5),
('Tablet iPad Air', 'Electronics', 7000000, 8500000, 6, 3),
('Smartwatch Apple Watch', 'Electronics', 4000000, 5000000, 8, 4),
('Power Bank 20000mAh', 'Electronics', 250000, 350000, 30, 15),
('Webcam Logitech HD', 'Electronics', 800000, 1200000, 18, 8)
ON CONFLICT DO NOTHING;

-- Verifikasi
SELECT 'Tables created successfully in store-db!' as status;
\dt

-- Tampilkan jumlah data
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'sales_transactions', COUNT(*) FROM sales_transactions
UNION ALL
SELECT 'restock_transactions', COUNT(*) FROM restock_transactions;

COMMIT;
