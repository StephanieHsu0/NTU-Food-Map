/**
 * Fetch places data from Google Places API
 * 
 * Usage:
 *   node scripts/fetch_places.js
 * 
 * Make sure to set GOOGLE_PLACES_API_KEY in your .env file
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'example_key';
const NTU_CENTER = { lat: 25.0170, lng: 121.5395 };
const RADIUS = 2000; // meters

// Sample place types to search for
const PLACE_TYPES = [
  'restaurant',
  'cafe',
  'food',
  'meal_takeaway',
  'meal_delivery',
];

/**
 * Search for places using Google Places API (Text Search)
 * Note: This is a simplified example. In production, you might want to use:
 * - Places API (New) - Text Search
 * - Places API (New) - Nearby Search
 * - Places API (New) - Place Details
 */
async function fetchPlaces() {
  console.log('Fetching places from Google Places API...');
  console.log('Note: This script requires a valid Google Places API key.');
  console.log('For now, it will generate sample data structure.\n');

  // In a real implementation, you would make HTTP requests to Google Places API
  // Example structure:
  /*
  const axios = require('axios');
  const places = [];
  
  for (const type of PLACE_TYPES) {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: `${type} near National Taiwan University`,
        location: `${NTU_CENTER.lat},${NTU_CENTER.lng}`,
        radius: RADIUS,
        key: GOOGLE_PLACES_API_KEY,
      },
    });
    
    // Process and transform the data
    // ...
  }
  */

  // For now, return sample data structure that matches our schema
  const samplePlaces = [
    {
      id: 'google_place_001',
      name_zh: '示例餐廳',
      name_en: 'Sample Restaurant',
      address_zh: '台北市大安區羅斯福路四段100號',
      address_en: 'No. 100, Section 4, Roosevelt Road, Da\'an District, Taipei',
      phone: '+886-2-1234-5678',
      price_level: 2,
      rating: 4.3,
      rating_count: 150,
      lat: 25.0160,
      lng: 121.5380,
      categories: ['餐廳', '中式'],
      features: ['international_friendly', 'wifi'],
      open_hours: {
        Monday: ['11:00-21:00'],
        Tuesday: ['11:00-21:00'],
        Wednesday: ['11:00-21:00'],
        Thursday: ['11:00-21:00'],
        Friday: ['11:00-22:00'],
        Saturday: ['11:00-22:00'],
        Sunday: ['11:00-21:00'],
      },
      photos: [],
      website: null,
    },
  ];

  const outputPath = path.join(__dirname, '../db/places_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(samplePlaces, null, 2));
  console.log(`Sample data written to ${outputPath}`);
  console.log('\nTo fetch real data:');
  console.log('1. Get a Google Places API key from Google Cloud Console');
  console.log('2. Enable Places API (New)');
  console.log('3. Update this script to make actual API calls');
  console.log('4. Transform the API response to match our schema');
}

// Run the script
fetchPlaces().catch((error) => {
  console.error('Error fetching places:', error);
  process.exit(1);
});

