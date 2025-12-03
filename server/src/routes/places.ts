import express, { Request, Response } from 'express';
import connectToDatabase from '../db';
import { calculateScore } from '../scoring';
import { Place, FilterParams, PlaceDocument } from '../types';

const router = express.Router();

/**
 * GET /api/places
 * Get filtered list of places with recommendation scores
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: FilterParams = {
      lat: req.query.lat ? parseFloat(req.query.lat as string) : 25.0170,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : 121.5395,
      radius: req.query.radius ? parseInt(req.query.radius as string) : 2000,
      price_max: req.query.price_max ? parseInt(req.query.price_max as string) : undefined,
      rating_min: req.query.rating_min ? parseFloat(req.query.rating_min as string) : undefined,
      categories: req.query['categories[]']
        ? Array.isArray(req.query['categories[]'])
          ? (req.query['categories[]'] as string[])
          : [req.query['categories[]'] as string]
        : undefined,
      features: req.query['features[]']
        ? Array.isArray(req.query['features[]'])
          ? (req.query['features[]'] as string[])
          : [req.query['features[]'] as string]
        : undefined,
      open_now: req.query.open_now === 'true',
    };

    const db = await connectToDatabase();
    const placesCollection = db.collection<PlaceDocument>('places');

    // Build MongoDB query
    const query: any = {};

    // Geospatial query - find places within radius
    if (filters.lat && filters.lng && filters.radius) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.lng, filters.lat], // MongoDB uses [lng, lat]
          },
          $maxDistance: filters.radius,
        },
      };
    }

    // Price filter
    if (filters.price_max) {
      query.price_level = { $lte: filters.price_max };
    }

    // Rating filter
    if (filters.rating_min !== undefined) {
      query.rating = { $gte: filters.rating_min };
    }

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      query.categories = { $in: filters.categories };
    }

    // Features filter
    if (filters.features && filters.features.length > 0) {
      query.features = { $in: filters.features };
    }

    // Execute query
    const cursor = placesCollection.find(query).limit(100);
    const documents = await cursor.toArray();

    // Transform MongoDB documents to Place objects
    const places: Place[] = documents.map((doc) => {
      // Calculate distance using geospatial data
      const distance_m = calculateDistance(
        filters.lat!,
        filters.lng!,
        doc.location.coordinates[1], // latitude
        doc.location.coordinates[0]  // longitude
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
        is_open: doc.open_hours ? checkIfOpen(doc.open_hours) : undefined,
      };

      // Calculate recommendation score
      const { score, breakdown } = calculateScore(
        place,
        filters.lat!,
        filters.lng!
      );
      place.score = score;
      place.score_breakdown = breakdown;

      return place;
    });

    // Sort by score
    places.sort((a, b) => (b.score || 0) - (a.score || 0));

    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

/**
 * GET /api/places/:id
 * Get detailed information about a specific place
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 25.0170;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 121.5395;

    const db = await connectToDatabase();
    const placesCollection = db.collection<PlaceDocument>('places');

    const doc = await placesCollection.findOne({ id });

    if (!doc) {
      return res.status(404).json({ error: 'Place not found' });
    }

    // Calculate distance
    const distance_m = calculateDistance(
      lat,
      lng,
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
    const { score, breakdown } = calculateScore(place, lat, lng);
    place.score = score;
    place.score_breakdown = breakdown;

    res.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ error: 'Failed to fetch place' });
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

/**
 * Simple check if place is open (can be enhanced with actual time checking)
 */
function checkIfOpen(openHours: { [key: string]: string[] }): boolean {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return openHours[today] !== undefined && openHours[today].length > 0;
}

export default router;
