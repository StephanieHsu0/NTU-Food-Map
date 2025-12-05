import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { calculateScore, calculateDistance } from '@/lib/scoring';
import { Place, PlaceDocument } from '@/utils/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 25.0170;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : 121.5395;

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid place ID' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const placesCollection = db.collection<PlaceDocument>('places');

    const doc = await placesCollection.findOne({ id });

    if (!doc) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404 }
      );
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

    return NextResponse.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place' },
      { status: 500 }
    );
  }
}

