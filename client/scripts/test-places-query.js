#!/usr/bin/env node

/**
 * Test Places Query Directly
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ntu_food_map';
const DB_NAME = process.env.DB_NAME || 'ntu_food_map';

async function testQuery() {
  console.log('🔍 測試 MongoDB 查詢...\n');
  console.log('連線字串:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  console.log('資料庫:', DB_NAME);
  console.log('');

  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('1. 連線到 MongoDB...');
    await client.connect();
    console.log('   ✅ 連線成功\n');

    const db = client.db(DB_NAME);
    const placesCollection = db.collection('places');

    // Test 1: Simple count
    console.log('2. 測試簡單查詢（計算總數）...');
    const count = await placesCollection.countDocuments();
    console.log(`   ✅ 總共有 ${count} 筆地點資料\n`);

    // Test 2: Simple find without geospatial
    console.log('3. 測試簡單查詢（不使用地理空間）...');
    const simpleDocs = await placesCollection.find({}).limit(5).toArray();
    console.log(`   ✅ 找到 ${simpleDocs.length} 筆資料\n`);

    // Test 3: Check if 2dsphere index exists
    console.log('4. 檢查地理空間索引...');
    const indexes = await placesCollection.indexes();
    const geoIndex = indexes.find(idx => idx.key && idx.key.location === '2dsphere');
    if (geoIndex) {
      console.log('   ✅ 找到 2dsphere 索引');
      console.log('   索引詳情:', JSON.stringify(geoIndex, null, 2));
    } else {
      console.log('   ❌ 未找到 2dsphere 索引');
      console.log('   現有索引:', indexes.map(idx => Object.keys(idx.key || {})).join(', '));
    }
    console.log('');

    // Test 4: Geospatial query
    console.log('5. 測試地理空間查詢...');
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [121.5395, 25.0170], // [lng, lat]
          },
          $maxDistance: 2000,
        },
      },
    };
    
    console.log('   查詢:', JSON.stringify(query, null, 2));
    console.log('   執行查詢（最多等待 10 秒）...');
    
    const startTime = Date.now();
    const geoDocs = await Promise.race([
      placesCollection.find(query).limit(10).toArray(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('查詢超時')), 10000)
      )
    ]);
    const endTime = Date.now();
    
    console.log(`   ✅ 查詢成功（耗時: ${endTime - startTime}ms）`);
    console.log(`   ✅ 找到 ${geoDocs.length} 筆資料\n`);

    // Test 5: Query with filters
    console.log('6. 測試帶篩選的查詢...');
    const filterQuery = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [121.5395, 25.0170],
          },
          $maxDistance: 2000,
        },
      },
      rating: { $gte: 4.0 },
      price_level: { $lte: 3 },
    };
    
    console.log('   查詢:', JSON.stringify(filterQuery, null, 2));
    const filterStartTime = Date.now();
    const filterDocs = await Promise.race([
      placesCollection.find(filterQuery).limit(10).toArray(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('查詢超時')), 10000)
      )
    ]);
    const filterEndTime = Date.now();
    
    console.log(`   ✅ 查詢成功（耗時: ${filterEndTime - filterStartTime}ms）`);
    console.log(`   ✅ 找到 ${filterDocs.length} 筆資料\n`);

    console.log('✅ 所有測試通過！\n');

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    console.error('堆疊:', error.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('連線已關閉');
  }
}

testQuery();

