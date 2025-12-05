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
    
    // Create indexes (idempotent - safe to call multiple times)
    await placesCollection.createIndex({ location: '2dsphere' }).catch(() => {});
    await placesCollection.createIndex({ rating: -1 }).catch(() => {});
    await placesCollection.createIndex({ price_level: 1 }).catch(() => {});
    await placesCollection.createIndex({ categories: 1 }).catch(() => {});
    await placesCollection.createIndex({ features: 1 }).catch(() => {});
  } catch (error) {
    // Indexes might already exist, ignore errors
    console.error('Error creating indexes:', error);
  }
}

