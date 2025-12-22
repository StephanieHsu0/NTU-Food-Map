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
    // Check if connection is still alive
    try {
      await cachedClient!.db().admin().ping();
      return cachedDb;
    } catch (error) {
      // Connection is dead, reset cache
      console.log('MongoDB connection lost, reconnecting...');
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000, // 10 second timeout
    });
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Create indexes for better query performance (idempotent)
    // Don't wait for indexes in production to speed up connection
    createIndexes(db).catch(err => {
      console.warn('Index creation warning (non-critical):', err.message);
    });
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    cachedClient = null;
    cachedDb = null;
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
    await accountsCollection.createIndex({ provider: 1, providerAccountId: 1 }, { unique: true }).catch(() => {});
    await accountsCollection.createIndex({ userId: 1 }).catch(() => {});
    
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

