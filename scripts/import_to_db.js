/**
 * Import places data from JSON file to MongoDB
 * 
 * Usage:
 *   node scripts/import_to_db.js [path_to_json_file]
 * 
 * Default: imports from db/seed.json
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ntu_food_map';
const DB_NAME = process.env.DB_NAME || 'ntu_food_map';

async function importPlaces(jsonFilePath) {
  console.log(`Reading data from ${jsonFilePath}...`);
  
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`File not found: ${jsonFilePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  console.log(`Found ${data.length} places to import\n`);

  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const placesCollection = db.collection('places');

    // Create indexes
    await placesCollection.createIndex({ location: '2dsphere' });
    await placesCollection.createIndex({ rating: -1 });
    await placesCollection.createIndex({ price_level: 1 });
    await placesCollection.createIndex({ categories: 1 });
    await placesCollection.createIndex({ features: 1 });
    console.log('Indexes created\n');

    let imported = 0;
    let updated = 0;

    for (const place of data) {
      // Transform data to MongoDB format
      const document = {
        id: place.id,
        name_zh: place.name_zh,
        name_en: place.name_en,
        address_zh: place.address_zh || '',
        address_en: place.address_en || '',
        phone: place.phone || null,
        price_level: place.price_level,
        rating: place.rating,
        rating_count: place.rating_count || 0,
        lat: place.lat,
        lng: place.lng,
        location: {
          type: 'Point',
          coordinates: [place.lng, place.lat], // MongoDB uses [lng, lat]
        },
        categories: place.categories || [],
        features: place.features || [],
        open_hours: place.open_hours || null,
        photos: place.photos || [],
        website: place.website || null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use upsert to insert or update
      const result = await placesCollection.updateOne(
        { id: place.id },
        { $set: document },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        console.log(`✓ Imported: ${place.name_zh} (${place.name_en})`);
        imported++;
      } else {
        console.log(`↻ Updated: ${place.name_zh} (${place.name_en})`);
        updated++;
      }
    }

    console.log(`\n✅ Successfully imported ${imported} places and updated ${updated} places!`);
  } catch (error) {
    console.error('Error importing places:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

async function main() {
  const jsonFile = process.argv[2] || path.join(__dirname, '../db/seed.json');
  
  // Try seed.json first, then places_data.json
  let filePath = jsonFile;
  if (!fs.existsSync(filePath) && jsonFile.endsWith('seed.json')) {
    const altPath = path.join(__dirname, '../db/places_data.json');
    if (fs.existsSync(altPath)) {
      filePath = altPath;
      console.log(`Using ${altPath} instead\n`);
    }
  }

  try {
    await importPlaces(filePath);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
