#!/usr/bin/env node

/**
 * Test Startup - Check if the app can initialize
 */

console.log('🧪 Testing app initialization...\n');

// Test 1: Check if we can import auth
console.log('1. Testing NextAuth configuration...');
try {
  // We can't actually import NextAuth in Node.js context, but we can check the file
  const fs = require('fs');
  const path = require('path');
  const authPath = path.join(__dirname, '..', 'lib', 'auth.ts');
  
  if (fs.existsSync(authPath)) {
    const authContent = fs.readFileSync(authPath, 'utf8');
    
    // Check for syntax errors (basic checks)
    if (authContent.includes('export const { handlers')) {
      console.log('   ✅ auth.ts structure looks correct');
    } else {
      console.log('   ❌ auth.ts may have issues');
    }
    
    // Check for common errors
    if (authContent.includes("console.error('❌")) {
      console.log('   ⚠️  Found error messages in auth.ts - check configuration');
    }
  } else {
    console.log('   ❌ auth.ts not found');
  }
} catch (error) {
  console.log('   ❌ Error checking auth.ts:', error.message);
}

// Test 2: Check environment variables loading
console.log('\n2. Testing environment variables...');
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
  
  const required = ['AUTH_SECRET', 'MONGODB_URI', 'DB_NAME'];
  let allPresent = true;
  
  required.forEach(varName => {
    if (process.env[varName] || process.env[varName.replace('AUTH_', 'NEXTAUTH_')]) {
      console.log(`   ✅ ${varName} is set`);
    } else {
      console.log(`   ❌ ${varName} is NOT set`);
      allPresent = false;
    }
  });
  
  if (allPresent) {
    console.log('   ✅ All required environment variables are present');
  } else {
    console.log('   ❌ Some required environment variables are missing');
  }
} catch (error) {
  console.log('   ❌ Error loading environment variables:', error.message);
}

// Test 3: Check MongoDB connection (optional)
console.log('\n3. Testing MongoDB connection (optional)...');
try {
  const { MongoClient } = require('mongodb');
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('   ⚠️  MONGODB_URI not set - skipping connection test');
  } else {
    console.log('   ⏳ Attempting to connect...');
    const client = new MongoClient(uri);
    
    // Try to connect with a timeout
    Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]).then(() => {
      console.log('   ✅ MongoDB connection successful');
      client.close();
    }).catch(error => {
      console.log(`   ⚠️  MongoDB connection failed: ${error.message}`);
      console.log('   Note: This is OK if MongoDB is not running or not accessible');
    });
  }
} catch (error) {
  console.log('   ⚠️  Could not test MongoDB connection:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('   1. If all checks passed, try: npm run dev');
console.log('   2. If there are errors, check the console output above');
console.log('   3. Make sure MongoDB is running and accessible (if using database features)');
console.log('   4. Check browser console for any runtime errors\n');

