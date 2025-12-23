import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { calculateScore, calculateDistance, checkIfOpen } from '@/lib/scoring';
import { Place, FilterParams, PlaceDocument } from '@/utils/types';

// Force dynamic rendering - this route uses searchParams which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 🔴 安全檢查：輸入參數驗證
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');
    const priceMaxParam = searchParams.get('price_max');
    const ratingMinParam = searchParams.get('rating_min');

    // 驗證數值參數
    const lat = latParam ? (() => {
      const val = parseFloat(latParam);
      return !isNaN(val) && val >= -90 && val <= 90 ? val : 25.0170;
    })() : 25.0170;

    const lng = lngParam ? (() => {
      const val = parseFloat(lngParam);
      return !isNaN(val) && val >= -180 && val <= 180 ? val : 121.5395;
    })() : 121.5395;

    const radius = radiusParam ? (() => {
      const val = parseInt(radiusParam, 10);
      return !isNaN(val) && val > 0 && val <= 50000 ? val : 2000; // 最大 50km
    })() : 2000;

    const price_max = priceMaxParam ? (() => {
      const val = parseInt(priceMaxParam, 10);
      return !isNaN(val) && val >= 1 && val <= 4 ? val : undefined;
    })() : undefined;

    const rating_min = ratingMinParam ? (() => {
      const val = parseFloat(ratingMinParam);
      return !isNaN(val) && val >= 0 && val <= 5 ? val : undefined;
    })() : undefined;

    const filters: FilterParams = {
      lat,
      lng,
      radius,
      price_max,
      rating_min,
      categories: searchParams.getAll('categories[]').length > 0
        ? searchParams.getAll('categories[]').filter(cat => cat && cat.length <= 50) // 防止過長的類別名稱
        : undefined,
      features: searchParams.getAll('features[]').length > 0
        ? searchParams.getAll('features[]').filter(feat => feat && feat.length <= 50) // 防止過長的特徵名稱
        : undefined,
      open_now: searchParams.get('open_now') === 'true',
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

    // Filter by open_now if specified
    let filteredPlaces = places;
    if (filters.open_now === true) {
      filteredPlaces = places.filter((place) => place.is_open === true);
    }

    // Sort by score
    filteredPlaces.sort((a, b) => (b.score || 0) - (a.score || 0));

    return NextResponse.json(filteredPlaces);
  } catch (error) {
    // 🔴 安全檢查：生產環境不記錄詳細錯誤，只記錄一般錯誤
    console.error('Error fetching places:', process.env.NODE_ENV === 'production' ? 'Internal server error' : error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}

