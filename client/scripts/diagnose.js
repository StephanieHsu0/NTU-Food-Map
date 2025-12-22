#!/usr/bin/env node

/**
 * Diagnostic Script - Check all potential issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running diagnostics...\n');

let issues = [];
let warnings = [];

// 1. Check .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  issues.push('❌ .env.local file not found');
} else {
  console.log('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  // Check AUTH_SECRET
  if (!envVars.AUTH_SECRET && !envVars.NEXTAUTH_SECRET) {
    issues.push('❌ AUTH_SECRET or NEXTAUTH_SECRET not set in .env.local');
  } else {
    console.log('✅ AUTH_SECRET is set');
  }
  
  // Check MongoDB
  if (!envVars.MONGODB_URI) {
    warnings.push('⚠️  MONGODB_URI not set - database features will not work');
  } else {
    console.log('✅ MONGODB_URI is set');
  }
  
  if (!envVars.DB_NAME) {
    warnings.push('⚠️  DB_NAME not set - using default');
  } else {
    console.log('✅ DB_NAME is set');
  }
  
  // Check OAuth (optional)
  if (!envVars.AUTH_GOOGLE_ID && !envVars.GOOGLE_CLIENT_ID) {
    warnings.push('⚠️  Google OAuth not configured - login will not work');
  } else {
    console.log('✅ Google OAuth is configured');
  }
}

// 2. Check node_modules
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  issues.push('❌ node_modules not found - run: npm install');
} else {
  console.log('✅ node_modules exists');
}

// 3. Check package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  issues.push('❌ package.json not found');
} else {
  console.log('✅ package.json exists');
}

// 4. Check Next.js config
const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
if (!fs.existsSync(nextConfigPath)) {
  warnings.push('⚠️  next.config.mjs not found');
} else {
  console.log('✅ next.config.mjs exists');
}

console.log('\n📋 Summary:\n');

if (issues.length > 0) {
  console.log('❌ Critical Issues (must fix):');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings (should fix):');
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('');
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed!');
  console.log('   Try starting the server: npm run dev\n');
} else if (issues.length === 0) {
  console.log('✅ No critical issues found.');
  console.log('   The app should start, but some features may not work.\n');
} else {
  console.log('❌ Please fix the critical issues above before starting the server.\n');
  process.exit(1);
}

