# SCRIPT POWERSHELL UNTUK SETUP DATABASE STORE-DB
# 
# PASTIKAN PostgreSQL sudah terinstall dan running
# 
# 1. Buka PowerShell sebagai Administrator
# 2. Jalankan script ini dengan: .\setup_database.ps1

Write-Host "=== STORE-DB DATABASE SETUP ===" -ForegroundColor Green

# Konfigurasi database
$DB_USER = "postgres"
$NEW_DB_NAME = "store-db"
$NEW_USER = "store_admin"
$NEW_PASSWORD = "storepass123"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "Menggunakan konfigurasi:" -ForegroundColor Yellow
Write-Host "Postgres User: $DB_USER" -ForegroundColor White
Write-Host "New Database: $NEW_DB_NAME" -ForegroundColor White
Write-Host "New User: $NEW_USER" -ForegroundColor White
Write-Host "Host: $DB_HOST" -ForegroundColor White
Write-Host "Port: $DB_PORT" -ForegroundColor White

# Prompt password
$DB_PASSWORD = Read-Host "Masukkan password PostgreSQL (postgres user)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$DB_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variable
$env:PGPASSWORD = $DB_PASSWORD_PLAIN

Write-Host "`nStep 1: Dropping old databases and creating new database..." -ForegroundColor Yellow

# Drop dan buat database baru
$sql_drop_file = Join-Path $PSScriptRoot "01_drop_and_create_new_db.sql"
if (Test-Path $sql_drop_file) {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f $sql_drop_file
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database store-db berhasil dibuat!" -ForegroundColor Green
    } else {
        Write-Host "❌ Gagal membuat database." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ File tidak ditemukan: $sql_drop_file" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Creating tables in store-db..." -ForegroundColor Yellow

# Update password untuk user baru
$env:PGPASSWORD = $NEW_PASSWORD

# Buat tabel-tabel
$sql_tables_file = Join-Path $PSScriptRoot "02_create_tables_store_db.sql"
if (Test-Path $sql_tables_file) {
    psql -h $DB_HOST -p $DB_PORT -U $NEW_USER -d $NEW_DB_NAME -f $sql_tables_file
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n=== SETUP BERHASIL! ===" -ForegroundColor Green
        Write-Host "Database baru: store-db" -ForegroundColor White
        Write-Host "User baru: store_admin" -ForegroundColor White
        Write-Host "Password: storepass123" -ForegroundColor White
        Write-Host "`nTabel-tabel berikut telah dibuat:" -ForegroundColor White
        Write-Host "- products (dengan 10 sample data)" -ForegroundColor Cyan
        Write-Host "- sales_transactions" -ForegroundColor Cyan
        Write-Host "- sales_items" -ForegroundColor Cyan
        Write-Host "- restock_transactions" -ForegroundColor Cyan
        Write-Host "- restock_items" -ForegroundColor Cyan
        Write-Host "- stock_movements" -ForegroundColor Cyan
        
        Write-Host "`n✅ Database store-db sudah siap digunakan!" -ForegroundColor Green
        Write-Host "✅ File .env sudah diupdate!" -ForegroundColor Green
        Write-Host "🚀 Restart backend server Anda sekarang." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Gagal membuat tabel. Periksa error di atas." -ForegroundColor Red
    }
} else {
    Write-Host "❌ File tidak ditemukan: $sql_tables_file" -ForegroundColor Red
}

# Bersihkan password dari environment
Remove-Item Env:PGPASSWORD

Write-Host "`nTekan Enter untuk keluar..." -ForegroundColor Gray
Read-Host
