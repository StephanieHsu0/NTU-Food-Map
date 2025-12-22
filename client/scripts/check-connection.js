#!/usr/bin/env node

/**
 * Connection Diagnostic Script
 * Checks if the development server is running and accessible
 */

const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const FRONTEND_PORT = 3000;
const BACKEND_PORT = 3001;

console.log('🔍 檢查連線狀態...\n');

// Check if ports are in use
async function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => {
        resolve(false); // Port is available
      });
    });
    server.on('error', () => {
      resolve(true); // Port is in use
    });
  });
}

// Test if server responds
async function testServer(port, name) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve({ success: true, status: res.statusCode });
    });
    
    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function checkProcessOnPort(port) {
  try {
    // Windows command
    if (process.platform === 'win32') {
      const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 0) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              pids.add(pid);
            }
          }
        });
        return Array.from(pids);
      }
    } else {
      // Unix/Mac command
      const { stdout } = await execPromise(`lsof -ti:${port}`);
      if (stdout.trim()) {
        return stdout.trim().split('\n');
      }
    }
  } catch (error) {
    // Port not in use or command failed
  }
  return [];
}

async function main() {
  console.log('1. 檢查端口狀態...');
  
  const frontendInUse = await checkPort(FRONTEND_PORT);
  const backendInUse = await checkPort(BACKEND_PORT);
  
  if (frontendInUse) {
    console.log(`   ✅ 端口 ${FRONTEND_PORT} 正在使用中`);
    const pids = await checkProcessOnPort(FRONTEND_PORT);
    if (pids.length > 0) {
      console.log(`   📌 使用該端口的進程 ID: ${pids.join(', ')}`);
    }
  } else {
    console.log(`   ❌ 端口 ${FRONTEND_PORT} 未被使用（開發伺服器可能未運行）`);
  }
  
  if (backendInUse) {
    console.log(`   ✅ 端口 ${BACKEND_PORT} 正在使用中`);
    const pids = await checkProcessOnPort(BACKEND_PORT);
    if (pids.length > 0) {
      console.log(`   📌 使用該端口的進程 ID: ${pids.join(', ')}`);
    }
  } else {
    console.log(`   ⚠️  端口 ${BACKEND_PORT} 未被使用（如果使用獨立後端，需要啟動）`);
  }
  
  console.log('\n2. 測試伺服器回應...');
  
  const frontendTest = await testServer(FRONTEND_PORT, '前端');
  if (frontendTest.success) {
    console.log(`   ✅ 前端伺服器 (http://localhost:${FRONTEND_PORT}) 正常回應`);
  } else {
    console.log(`   ❌ 前端伺服器 (http://localhost:${FRONTEND_PORT}) 無法連線: ${frontendTest.error}`);
  }
  
  const backendTest = await testServer(BACKEND_PORT, '後端');
  if (backendTest.success) {
    console.log(`   ✅ 後端伺服器 (http://localhost:${BACKEND_PORT}) 正常回應`);
  } else {
    console.log(`   ⚠️  後端伺服器 (http://localhost:${BACKEND_PORT}) 無法連線: ${backendTest.error}`);
    console.log(`   （如果使用 Serverless Functions，這是正常的）`);
  }
  
  console.log('\n3. 檢查 API 端點...');
  
  if (frontendTest.success) {
    const apiTest = await testServer(FRONTEND_PORT, 'API');
    const apiReq = http.get(`http://localhost:${FRONTEND_PORT}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ API 健康檢查端點正常');
        } else {
          console.log(`   ⚠️  API 健康檢查端點回應: ${res.statusCode}`);
        }
      });
    });
    
    apiReq.on('error', () => {
      console.log('   ⚠️  無法連接到 API 健康檢查端點');
    });
    
    apiReq.setTimeout(2000, () => {
      apiReq.destroy();
    });
  } else {
    console.log('   ⏭️  跳過（前端伺服器未運行）');
  }
  
  console.log('\n📋 診斷結果:\n');
  
  if (!frontendTest.success) {
    console.log('❌ 主要問題: 前端開發伺服器未運行');
    console.log('\n💡 解決方案:');
    console.log('   1. 開啟新的終端機視窗');
    console.log('   2. 執行: cd client');
    console.log('   3. 執行: npm run dev');
    console.log('   4. 等待伺服器啟動（應該會顯示 "Ready" 訊息）');
    console.log('   5. 在瀏覽器開啟 http://localhost:3000\n');
  } else {
    console.log('✅ 前端伺服器正在運行');
    console.log('   如果瀏覽器仍顯示連線錯誤，請嘗試:');
    console.log('   1. 清除瀏覽器快取 (Ctrl+Shift+Delete)');
    console.log('   2. 使用無痕模式開啟');
    console.log('   3. 檢查瀏覽器控制台是否有錯誤訊息');
    console.log('   4. 確認網址是 http://localhost:3000\n');
  }
  
  // Check if using separate backend
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_API_URL=http://localhost:3001')) {
      console.log('📌 偵測到您使用獨立後端模式');
      if (!backendTest.success) {
        console.log('   ⚠️  後端伺服器未運行，需要啟動:');
        console.log('   1. 開啟新的終端機視窗');
        console.log('   2. 執行: cd server');
        console.log('   3. 執行: npm run dev\n');
      }
    }
  }
}

main().catch(console.error);

