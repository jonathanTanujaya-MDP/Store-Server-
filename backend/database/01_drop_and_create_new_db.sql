-- SCRIPT UNTUK MENGHAPUS DATABASE LAMA
-- Jalankan sebagai superuser (postgres)
-- psql -U postgres -d postgres

-- Drop database jika ada
DROP DATABASE IF EXISTS manajemen_stock;
DROP DATABASE IF EXISTS postgres; -- HATI-HATI: Ini akan drop database postgres default!

-- Drop user jika ada
DROP USER IF EXISTS stock_user;

-- Buat database baru
CREATE DATABASE "store-db";

-- Buat user baru untuk aplikasi
CREATE USER store_admin WITH PASSWORD 'storepass123';

-- Berikan semua privilege ke user baru
GRANT ALL PRIVILEGES ON DATABASE "store-db" TO store_admin;

-- Connect ke database baru
\c store-db

-- Berikan privilege untuk schema public
GRANT ALL ON SCHEMA public TO store_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO store_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO store_admin;

SELECT 'Database store-db berhasil dibuat!' as status;
