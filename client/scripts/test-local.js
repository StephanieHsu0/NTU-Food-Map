#!/usr/bin/env node

/**
 * Local Testing Script
 * Tests all main API endpoints and functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000, // 增加超時時間到 30 秒
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            raw: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  try {
    log(`\n🧪 測試: ${name}`, 'cyan');
    log(`   URL: ${url}`, 'blue');
    
    const result = await makeRequest(url, options);
    
    if (result.status >= 200 && result.status < 300) {
      log(`   ✅ 成功 (狀態碼: ${result.status})`, 'green');
      if (result.data && typeof result.data === 'object') {
        const preview = JSON.stringify(result.data).substring(0, 200);
        log(`   📄 回應: ${preview}${preview.length >= 200 ? '...' : ''}`, 'blue');
      }
      return { success: true, result };
    } else {
      log(`   ⚠️  回應狀態碼: ${result.status}`, 'yellow');
      if (result.data) {
        log(`   📄 回應: ${JSON.stringify(result.data).substring(0, 200)}`, 'yellow');
      }
      return { success: false, result };
    }
  } catch (error) {
    log(`   ❌ 錯誤: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n🚀 開始本機端測試...\n', 'cyan');
  log('=' .repeat(60), 'cyan');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Health Check
  const healthTest = await testEndpoint('健康檢查', `${API_BASE}/health`);
  if (healthTest.success) {
    results.passed++;
  } else {
    results.failed++;
    log('\n❌ 健康檢查失敗 - 伺服器可能未正常運行', 'red');
    return;
  }

  // Test 2: Auth Test (檢查環境變數)
  const authTest = await testEndpoint('認證設定檢查', `${API_BASE}/auth/test`);
  if (authTest.success) {
    results.passed++;
    if (authTest.result && authTest.result.data) {
      const env = authTest.result.data.env || {};
      if (!env.hasMongoUri) {
        log('   ⚠️  警告: MONGODB_URI 未設定', 'yellow');
        results.warnings++;
      }
      if (!env.hasAuthSecret) {
        log('   ⚠️  警告: AUTH_SECRET 未設定', 'yellow');
        results.warnings++;
      }
    }
  } else {
    results.failed++;
  }

  // Test 3: Places API (基本查詢)
  const placesTest = await testEndpoint(
    '地點列表 API',
    `${API_BASE}/places?lat=25.0170&lng=121.5395&radius=2000`
  );
  if (placesTest.success) {
    results.passed++;
    if (placesTest.result && placesTest.result.data) {
      const places = Array.isArray(placesTest.result.data) ? placesTest.result.data : [];
      log(`   📍 找到 ${places.length} 個地點`, 'green');
      if (places.length === 0) {
        log('   ⚠️  警告: 資料庫中沒有地點資料', 'yellow');
        results.warnings++;
      }
    }
  } else {
    results.failed++;
  }

  // Test 4: Places API (帶篩選)
  const placesFilterTest = await testEndpoint(
    '地點列表 API (帶篩選)',
    `${API_BASE}/places?lat=25.0170&lng=121.5395&radius=2000&rating_min=4.0&price_max=3`
  );
  if (placesFilterTest.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Debug Endpoint
  const debugTest = await testEndpoint('除錯端點', `${API_BASE}/debug`);
  if (debugTest.success) {
    results.passed++;
  } else {
    results.warnings++; // Debug endpoint is optional
  }

  // Test 6: Frontend Page
  try {
    log(`\n🧪 測試: 前端頁面`, 'cyan');
    log(`   URL: ${BASE_URL}`, 'blue');
    const pageTest = await makeRequest(BASE_URL);
    if (pageTest.status >= 200 && pageTest.status < 300) {
      log(`   ✅ 前端頁面可訪問 (狀態碼: ${pageTest.status})`, 'green');
      results.passed++;
    } else {
      log(`   ⚠️  前端頁面回應狀態碼: ${pageTest.status}`, 'yellow');
      results.warnings++;
    }
  } catch (error) {
    log(`   ❌ 無法訪問前端頁面: ${error.message}`, 'red');
    results.failed++;
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 測試結果總結:', 'cyan');
  log(`   ✅ 通過: ${results.passed}`, 'green');
  log(`   ⚠️  警告: ${results.warnings}`, 'yellow');
  log(`   ❌ 失敗: ${results.failed}`, 'red');

  if (results.failed === 0) {
    log('\n🎉 所有測試通過！應用程式運行正常。', 'green');
    log('\n💡 下一步:', 'cyan');
    log('   1. 在瀏覽器開啟 http://localhost:3000', 'blue');
    log('   2. 測試主要功能（地圖、篩選、轉盤等）', 'blue');
    log('   3. 檢查瀏覽器控制台是否有錯誤', 'blue');
  } else {
    log('\n⚠️  部分測試失敗，請檢查上述錯誤訊息。', 'yellow');
  }

  log('\n');
}

main().catch((error) => {
  log(`\n❌ 測試腳本執行錯誤: ${error.message}`, 'red');
  log(error.stack, 'red');
  process.exit(1);
});

