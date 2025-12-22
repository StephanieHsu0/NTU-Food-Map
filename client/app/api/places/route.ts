import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { calculateScore, calculateDistance, checkIfOpen } from '@/lib/scoring';
import { Place, FilterParams, PlaceDocument } from '@/utils/types';

// Force dynamic rendering - this route uses searchParams which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Places API] Request received');
    const searchParams = request.nextUrl.searchParams;
    
    const filters: FilterParams = {
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 25.0170,
      lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : 121.5395,
      radius: searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 2000,
      price_max: searchParams.get('price_max') ? parseInt(searchParams.get('price_max')!) : undefined,
      rating_min: searchParams.get('rating_min') ? parseFloat(searchParams.get('rating_min')!) : undefined,
      categories: searchParams.getAll('categories[]').length > 0 
        ? searchParams.getAll('categories[]')
        : undefined,
      features: searchParams.getAll('features[]').length > 0
        ? searchParams.getAll('features[]')
        : undefined,
      open_now: searchParams.get('open_now') === 'true',
    };

    console.log('[Places API] Filters:', filters);
    console.log('[Places API] Connecting to database...');
    const db = await connectToDatabase();
    console.log('[Places API] Database connected');
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
    console.log('[Places API] Query:', JSON.stringify(query));
    console.log('[Places API] Executing query...');
    const cursor = placesCollection.find(query).limit(100);
    const documents = await cursor.toArray();
    console.log(`[Places API] Found ${documents.length} documents`);

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

    // Filter by open_now if specified
    let filteredPlaces = places;
    if (filters.open_now === true) {
      filteredPlaces = places.filter((place) => place.is_open === true);
    }

    // Sort by score
    filteredPlaces.sort((a, b) => (b.score || 0) - (a.score || 0));

    return NextResponse.json(filteredPlaces);
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}

