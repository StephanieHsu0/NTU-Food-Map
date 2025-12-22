#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Run this script to check if all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment variables...\n');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.local.example');

// Required variables
const requiredVars = {
  'AUTH_SECRET': 'NextAuth.js secret key (generate with: openssl rand -base64 32)',
  'MONGODB_URI': 'MongoDB connection string',
  'DB_NAME': 'Database name',
};

// Optional but recommended
const recommendedVars = {
  'AUTH_URL': 'NextAuth.js base URL (defaults to http://localhost:3000)',
  'NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY': 'Google Maps API key',
  'AUTH_GOOGLE_ID': 'Google OAuth Client ID (optional)',
  'AUTH_GOOGLE_SECRET': 'Google OAuth Client Secret (optional)',
};

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log(`   Expected location: ${envPath}`);
  console.log('   Please create .env.local file with required variables.\n');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('   You can copy .env.local.example as a template:');
    console.log(`   cp ${envExamplePath} ${envPath}\n`);
  }
} else {
  console.log('✅ .env.local file found\n');
  
  // Load environment variables
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
  
  // Check required variables
  console.log('📋 Required Variables:');
  let allRequiredPresent = true;
  for (const [varName, description] of Object.entries(requiredVars)) {
    if (envVars[varName]) {
      const value = envVars[varName];
      const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD') 
        ? '*'.repeat(Math.min(value.length, 20)) 
        : value.substring(0, 50);
      console.log(`   ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`   ❌ ${varName}: NOT SET`);
      console.log(`      ${description}`);
      allRequiredPresent = false;
    }
  }
  
  console.log('\n📋 Recommended Variables:');
  for (const [varName, description] of Object.entries(recommendedVars)) {
    if (envVars[varName]) {
      const value = envVars[varName];
      const displayValue = varName.includes('SECRET') || varName.includes('KEY')
        ? '*'.repeat(Math.min(value.length, 20))
        : value.substring(0, 50);
      console.log(`   ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`   ⚠️  ${varName}: NOT SET (optional)`);
      console.log(`      ${description}`);
    }
  }
  
  console.log('\n');
  
  if (allRequiredPresent) {
    console.log('✅ All required environment variables are set!');
    console.log('   You can now start the development server with: npm run dev\n');
  } else {
    console.log('❌ Some required environment variables are missing!');
    console.log('   Please set them in .env.local before starting the server.\n');
    process.exit(1);
  }
}

