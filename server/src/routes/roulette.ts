import express, { Request, Response } from 'express';
import connectToDatabase from '../db';
import { calculateScore } from '../scoring';
import { Place, FilterParams, PlaceDocument, RouletteRequest } from '../types';

const router = express.Router();

/**
 * POST /api/roulette
 * Get a random place from the filtered pool
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: RouletteRequest = req.body;
    const filters: FilterParams = {
      lat: body.lat,
      lng: body.lng,
      radius: body.filters?.radius || 2000,
      price_max: body.filters?.price_max,
      rating_min: body.filters?.rating_min,
      categories: body.filters?.categories,
      features: body.filters?.features,
      open_now: body.filters?.open_now,
    };

    const db = await connectToDatabase();
    const placesCollection = db.collection<PlaceDocument>('places');

    // Build MongoDB query (same as places route)
    const query: any = {};

    if (filters.lat && filters.lng && filters.radius) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.lng, filters.lat],
          },
          $maxDistance: filters.radius,
        },
      };
    }

    if (filters.price_max) {
      query.price_level = { $lte: filters.price_max };
    }

    if (filters.rating_min !== undefined) {
      query.rating = { $gte: filters.rating_min };
    }

    if (filters.categories && filters.categories.length > 0) {
      query.categories = { $in: filters.categories };
    }

    if (filters.features && filters.features.length > 0) {
      query.features = { $in: filters.features };
    }

    // Get all matching places
    const cursor = placesCollection.find(query);
    const documents = await cursor.toArray();

    if (documents.length === 0) {
      return res.status(404).json({ error: 'No places found matching filters' });
    }

    // Randomly select one place
    const randomIndex = Math.floor(Math.random() * documents.length);
    const doc = documents[randomIndex];

    // Calculate distance
    const distance_m = calculateDistance(
      filters.lat!,
      filters.lng!,
      doc.location.coordinates[1],
      doc.location.coordinates[0]
    );

    const place: Place = {
      id: doc.id,
      name_zh: doc.name_zh,
      name_en: doc.name_en,
      address_zh: doc.address_zh,
      address_en: doc.address_en,
      phone: doc.phone,
      price_level: doc.price_level,
      rating: doc.rating,
      rating_count: doc.rating_count,
      lat: doc.location.coordinates[1],
      lng: doc.location.coordinates[0],
      categories: doc.categories,
      features: doc.features,
      open_hours: doc.open_hours,
      photos: doc.photos,
      website: doc.website,
      distance_m: Math.round(distance_m),
    };

    // Calculate recommendation score
    const { score, breakdown } = calculateScore(place, filters.lat!, filters.lng!);
    place.score = score;
    place.score_breakdown = breakdown;

    res.json(place);
  } catch (error) {
    console.error('Error spinning roulette:', error);
    res.status(500).json({ error: 'Failed to spin roulette' });
  }
});

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default router;
