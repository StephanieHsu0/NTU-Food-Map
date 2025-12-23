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
  const ensureIndex = async (
    label: string,
    collection: any,
    keys: Record<string, any>,
    options: any = {}
  ) => {
    try {
      await collection.createIndex(keys, options);
      console.log(`✅ [DB] Index ensured: ${label}`);
    } catch (err: any) {
      // 如果是因為已有重複資料導致索引建立失敗，這是一個嚴重警告
      if (err?.code === 11000 || err?.codeName === 'DuplicateKey') {
        console.error(`❌ [DB] CRITICAL: Cannot create unique index ${label} because duplicate data already exists! Please clean up the database manually.`, err.message);
      } else if (err?.codeName === 'IndexOptionsConflict' || err?.codeName === 'IndexKeySpecsConflict') {
        console.warn(`⚠️ [DB] Index conflict (likely exists with different options): ${label} -> ${err.message}`);
      } else {
        console.error(`❌ [DB] Failed to create index: ${label}`, err);
      }
    }
  };

  try {
    const placesCollection = db.collection('places');
    
    await ensureIndex('places.location.2dsphere', placesCollection, { location: '2dsphere' });
    await ensureIndex('places.rating', placesCollection, { rating: -1 });
    await ensureIndex('places.price_level', placesCollection, { price_level: 1 });
    await ensureIndex('places.categories', placesCollection, { categories: 1 });
    await ensureIndex('places.features', placesCollection, { features: 1 });

    const usersCollection = db.collection('users');
    await ensureIndex('users.email', usersCollection, { email: 1 });
    
    const accountsCollection = db.collection('accounts');
    // 高優先：provider + providerAccountId 唯一
    await ensureIndex('accounts.provider_providerAccountId_unique', accountsCollection, { provider: 1, providerAccountId: 1 }, { unique: true });
    await ensureIndex('accounts.userId', accountsCollection, { userId: 1 });
    // 高優先：provider + id_token 部分唯一（僅對非 null）
    await ensureIndex(
      'accounts.provider_id_token_unique',
      accountsCollection,
      { provider: 1, id_token: 1 },
      {
        unique: true,
        partialFilterExpression: { id_token: { $type: 'string' } },
        name: 'unique_provider_id_token',
      }
    );
    
    const sessionsCollection = db.collection('sessions');
    await ensureIndex('sessions.sessionToken_unique', sessionsCollection, { sessionToken: 1 }, { unique: true });
    await ensureIndex('sessions.userId', sessionsCollection, { userId: 1 });

    const commentsCollection = db.collection('comments');
    await ensureIndex('comments.place_id', commentsCollection, { place_id: 1 });
    await ensureIndex('comments.user_id', commentsCollection, { user_id: 1 });
    await ensureIndex('comments.created_at', commentsCollection, { created_at: -1 });

    const favoritesCollection = db.collection('favorites');
    await ensureIndex('favorites.user_place_unique', favoritesCollection, { user_id: 1, place_id: 1 }, { unique: true });
    await ensureIndex('favorites.user_id', favoritesCollection, { user_id: 1 });
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

