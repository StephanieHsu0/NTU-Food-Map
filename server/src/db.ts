import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ntu_food_map';
const DB_NAME = process.env.DB_NAME || 'ntu_food_map';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Create indexes for better query performance
    await createIndexes(db);
    
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
    
    // Create 2dsphere index for geospatial queries
    await placesCollection.createIndex({ location: '2dsphere' });
    
    // Create other indexes
    await placesCollection.createIndex({ rating: -1 });
    await placesCollection.createIndex({ price_level: 1 });
    await placesCollection.createIndex({ categories: 1 });
    await placesCollection.createIndex({ features: 1 });
    
    console.log('MongoDB indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

export default connectToDatabase;
