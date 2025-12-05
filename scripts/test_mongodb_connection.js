/**
 * Test MongoDB connection with detailed error information
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'ntu_food_map';

// 從連線字串中提取資料庫名稱（如果連線字串中有指定）
// 格式：mongodb+srv://user:pass@host/dbname?params
let dbNameFromUri = null;
if (MONGODB_URI) {
  // 匹配 /資料庫名稱? 或 /資料庫名稱 結尾
  const match = MONGODB_URI.match(/\/([^/?]+)(?:\?|$)/);
  if (match && !match[1].includes('@')) {
    // 確保不是匹配到使用者名稱部分
    dbNameFromUri = match[1];
  }
}
const finalDbName = dbNameFromUri || DB_NAME;

console.log('=== MongoDB 連線測試 ===\n');
console.log('連線字串（隱藏密碼）:');
if (MONGODB_URI) {
  const masked = MONGODB_URI.replace(/:[^:@]+@/, ':***@');
  console.log(masked);
} else {
  console.log('❌ MONGODB_URI 未設定！');
  process.exit(1);
}

console.log('\n資料庫名稱:', finalDbName);
console.log('\n嘗試連線...\n');

async function testConnection() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    
    console.log('1. 建立連線...');
    await client.connect();
    console.log('   ✓ 連線建立成功\n');
    
    console.log('2. 測試資料庫存取...');
    const db = client.db(finalDbName);
    const collections = await db.listCollections().toArray();
    console.log(`   ✓ 資料庫 "${finalDbName}" 存取成功`);
    console.log(`   ✓ 找到 ${collections.length} 個集合\n`);
    
    if (collections.length > 0) {
      console.log('   集合列表:');
      collections.forEach(col => {
        console.log(`     - ${col.name}`);
      });
    }
    
    console.log('\n3. 測試 places 集合...');
    const placesCollection = db.collection('places');
    const count = await placesCollection.countDocuments();
    console.log(`   ✓ places 集合存在，目前有 ${count} 筆資料\n`);
    
    console.log('✅ 所有測試通過！MongoDB 連線正常。\n');
    
  } catch (error) {
    console.error('\n❌ 連線失敗！\n');
    console.error('錯誤類型:', error.constructor.name);
    console.error('錯誤訊息:', error.message);
    
    if (error.code === 8000 || error.codeName === 'AtlasError') {
      console.error('\n🔍 認證錯誤分析:');
      console.error('   這表示使用者名稱或密碼不正確。');
      console.error('   請檢查:');
      console.error('   1. MongoDB Atlas → Database Access');
      console.error('   2. 確認使用者名稱和密碼是否正確');
      console.error('   3. 確認使用者權限設定');
      console.error('   4. 如果密碼包含特殊字元，需要 URL 編碼');
      console.error('\n   建議：');
      console.error('   - 在 MongoDB Atlas 中重新建立資料庫使用者');
      console.error('   - 或重置現有使用者的密碼');
      console.error('   - 然後更新 .env 檔案中的連線字串');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 DNS 解析錯誤:');
      console.error('   無法解析 MongoDB 主機名稱。');
      console.error('   請檢查連線字串中的主機名稱是否正確。');
    } else {
      console.error('\n完整錯誤資訊:');
      console.error(error);
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('連線已關閉');
    }
  }
}

testConnection();
