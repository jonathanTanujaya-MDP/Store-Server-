const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing Store API Endpoints...\n');

    // Test 1: Get all products
    console.log('1️⃣ Testing GET /api/products');
    const products = await axios.get(`${BASE_URL}/products`);
    console.log(`✅ Products: ${products.data.length} items found`);
    
    if (products.data.length > 0) {
      const firstProduct = products.data[0];
      console.log(`   Sample: ${firstProduct.name} (Stock: ${firstProduct.stock_quantity})`);
      
      // Test 2: Create restock transaction
      console.log('\n2️⃣ Testing POST /api/restock');
      const restockData = {
        supplier_name: 'Test Supplier',
        items: [
          {
            product_id: firstProduct.id,
            quantity: 5,
            unit_cost: firstProduct.purchase_price
          }
        ]
      };
      
      const restock = await axios.post(`${BASE_URL}/restock`, restockData);
      console.log(`✅ Restock: ${restock.data.message}`);
      
      // Test 3: Create sales transaction
      console.log('\n3️⃣ Testing POST /api/sales');
      const salesData = {
        customer_name: 'Test Customer',
        items: [
          {
            product_id: firstProduct.id,
            quantity: 2
          }
        ]
      };
      
      const sales = await axios.post(`${BASE_URL}/sales`, salesData);
      console.log(`✅ Sales: ${sales.data.message}`);
      
      // Test 4: Get all transactions (combined)
      console.log('\n4️⃣ Testing GET /api/transactions');
      const transactions = await axios.get(`${BASE_URL}/transactions`);
      console.log(`✅ Transactions: ${transactions.data.length} total transactions`);
      
      // Test 5: Get sales transactions
      console.log('\n5️⃣ Testing GET /api/sales');
      const salesList = await axios.get(`${BASE_URL}/sales`);
      console.log(`✅ Sales History: ${salesList.data.length} sales transactions`);
      
      // Test 6: Get restock transactions
      console.log('\n6️⃣ Testing GET /api/restock');
      const restockList = await axios.get(`${BASE_URL}/restock`);
      console.log(`✅ Restock History: ${restockList.data.length} restock transactions`);
    }
    
    console.log('\n🎉 All API tests passed successfully!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

testAPI();
