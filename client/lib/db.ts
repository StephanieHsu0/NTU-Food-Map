import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables (for local development only)
// In Vercel production, environment variables are automatically available via process.env
// Only load .env files in local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  // Try loading from root directory (one level up from client)
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: rootEnvPath });
  // Also try loading from client/.env.local
  const localEnvPath = path.resolve(__dirname, '../.env.local');
  dotenv.config({ path: localEnvPath });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ntu_food_map';
const DB_NAME = process.env.DB_NAME || 'ntu_food_map';

// Cache the connection for serverless functions
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  // In serverless environments, reuse the connection if available
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Create indexes for better query performance (idempotent)
    await createIndexes(db);
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createIndexes(db: Db) {
  try {
    const placesCollection = db.collection('places');
    
    // Create indexes for places (idempotent - safe to call multiple times)
    await placesCollection.createIndex({ location: '2dsphere' }).catch(() => {});
    await placesCollection.createIndex({ rating: -1 }).catch(() => {});
    await placesCollection.createIndex({ price_level: 1 }).catch(() => {});
    await placesCollection.createIndex({ categories: 1 }).catch(() => {});
    await placesCollection.createIndex({ features: 1 }).catch(() => {});

    // Create indexes for users (NextAuth)
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }).catch(() => {});
    
    // Create indexes for accounts (NextAuth)
    const accountsCollection = db.collection('accounts');
    // 唯一索引：防止相同的 providerAccountId 連結到多個用戶
    await accountsCollection.createIndex({ provider: 1, providerAccountId: 1 }, { unique: true }).catch(() => {});
    await accountsCollection.createIndex({ userId: 1 }).catch(() => {});
    // 🔴 關鍵安全索引：防止相同的 id_token 被不同用戶使用
    // 注意：使用部分索引，只對非 null 的 id_token 創建唯一約束
    // MongoDB 的部分索引語法：{ partialFilterExpression: { id_token: { $ne: null } } }
    await accountsCollection.createIndex(
      { provider: 1, id_token: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { id_token: { $ne: null } },
        name: 'unique_provider_id_token'
      }
    ).catch((err) => {
      // 如果索引已存在或創建失敗，記錄但不阻止
      console.warn('⚠️ [DB] Could not create unique id_token index (may already exist):', err.message);
    });
    
    // Create indexes for sessions (NextAuth)
    const sessionsCollection = db.collection('sessions');
    await sessionsCollection.createIndex({ sessionToken: 1 }, { unique: true }).catch(() => {});
    await sessionsCollection.createIndex({ userId: 1 }).catch(() => {});

    // Create indexes for comments
    const commentsCollection = db.collection('comments');
    await commentsCollection.createIndex({ place_id: 1 }).catch(() => {});
    await commentsCollection.createIndex({ user_id: 1 }).catch(() => {});
    await commentsCollection.createIndex({ created_at: -1 }).catch(() => {});

    // Create indexes for favorites
    const favoritesCollection = db.collection('favorites');
    await favoritesCollection.createIndex({ user_id: 1, place_id: 1 }, { unique: true }).catch(() => {});
    await favoritesCollection.createIndex({ user_id: 1 }).catch(() => {});
  } catch (error) {
    // Indexes might already exist, ignore errors
    console.error('Error creating indexes:', error);
  }
}

