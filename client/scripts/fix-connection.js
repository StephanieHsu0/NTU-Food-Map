#!/usr/bin/env node

/**
 * Fix Connection Issues
 * Kills processes on ports 3000 and 3001, then provides restart instructions
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const FRONTEND_PORT = 3000;
const BACKEND_PORT = 3001;

console.log('🔧 修復連線問題...\n');

async function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows: Find and kill process on port
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
        
        for (const pid of pids) {
          try {
            console.log(`   🛑 正在終止進程 ${pid} (端口 ${port})...`);
            await execPromise(`taskkill /F /PID ${pid}`);
            console.log(`   ✅ 已終止進程 ${pid}`);
          } catch (error) {
            console.log(`   ⚠️  無法終止進程 ${pid}: ${error.message}`);
          }
        }
        return Array.from(pids).length > 0;
      }
    } else {
      // Unix/Mac
      const { stdout } = await execPromise(`lsof -ti:${port}`);
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          try {
            console.log(`   🛑 正在終止進程 ${pid} (端口 ${port})...`);
            await execPromise(`kill -9 ${pid}`);
            console.log(`   ✅ 已終止進程 ${pid}`);
          } catch (error) {
            console.log(`   ⚠️  無法終止進程 ${pid}: ${error.message}`);
          }
        }
        return pids.length > 0;
      }
    }
  } catch (error) {
    // No process found on port
  }
  return false;
}

async function main() {
  console.log('1. 清理端口 3000...');
  const frontendKilled = await killProcessOnPort(FRONTEND_PORT);
  if (!frontendKilled) {
    console.log('   ✅ 端口 3000 沒有被占用');
  }
  
  console.log('\n2. 清理端口 3001...');
  const backendKilled = await killProcessOnPort(BACKEND_PORT);
  if (!backendKilled) {
    console.log('   ✅ 端口 3001 沒有被占用');
  }
  
  console.log('\n✅ 清理完成！\n');
  console.log('📋 下一步:');
  console.log('   1. 開啟新的終端機視窗');
  console.log('   2. 執行以下命令啟動開發伺服器:\n');
  console.log('      cd "C:\\Users\\steph\\Desktop\\FINAL PROJECT\\client"');
  console.log('      npm run dev\n');
  console.log('   3. 等待看到 "Ready" 訊息');
  console.log('   4. 在瀏覽器開啟 http://localhost:3000\n');
}

main().catch(console.error);

