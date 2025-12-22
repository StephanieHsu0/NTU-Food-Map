#!/usr/bin/env node

/**
 * Quick Fix Script - Creates minimal .env.local if missing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('🔧 Quick Fix: Setting up minimal environment variables...\n');

// Generate a random secret
const secret = crypto.randomBytes(32).toString('base64');

const envContent = `# Auto-generated minimal configuration
# For production, please set proper values

# NextAuth Configuration (REQUIRED)
AUTH_SECRET=${secret}
AUTH_URL=http://localhost:3000

# MongoDB Configuration (REQUIRED - Update with your actual values)
# MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
# DB_NAME=ntu_food_map

# Google OAuth (OPTIONAL - for login)
# AUTH_GOOGLE_ID=your-google-client-id
# AUTH_GOOGLE_SECRET=your-google-client-secret

# Google Maps API (OPTIONAL - for map features)
# NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY=your-google-maps-api-key
`;

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log(`   Location: ${envPath}`);
  console.log('   Please check if AUTH_SECRET is set in the file.\n');
  
  // Check if AUTH_SECRET exists
  const existingContent = fs.readFileSync(envPath, 'utf8');
  if (!existingContent.includes('AUTH_SECRET=')) {
    console.log('❌ AUTH_SECRET not found in .env.local!');
    console.log('   Adding AUTH_SECRET to existing file...\n');
    
    // Append AUTH_SECRET if not present
    const updatedContent = existingContent + '\n# Auto-added AUTH_SECRET\nAUTH_SECRET=' + secret + '\n';
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ AUTH_SECRET has been added to .env.local');
  } else {
    console.log('✅ AUTH_SECRET already exists in .env.local');
  }
} else {
  console.log('📝 Creating .env.local file...');
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Created ${envPath}`);
  console.log('   AUTH_SECRET has been auto-generated');
}

console.log('\n📋 Next Steps:');
console.log('   1. Edit .env.local and set MONGODB_URI and DB_NAME');
console.log('   2. (Optional) Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET for login');
console.log('   3. (Optional) Set NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY for map features');
console.log('   4. Restart the development server: npm run dev\n');

