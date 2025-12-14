import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { calculateScore, calculateDistance } from '@/lib/scoring';
import { Place, FilterParams, PlaceDocument, RouletteRequest } from '@/utils/types';

// Force dynamic rendering - this route uses request.json() which is dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: RouletteRequest = await request.json();
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
      return NextResponse.json(
        { error: 'No places found matching filters' },
        { status: 404 }
      );
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

    return NextResponse.json(place);
  } catch (error) {
    console.error('Error spinning roulette:', error);
    return NextResponse.json(
      { error: 'Failed to spin roulette' },
      { status: 500 }
    );
  }
}

