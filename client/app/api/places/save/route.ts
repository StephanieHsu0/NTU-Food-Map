import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { PlaceDocument } from '@/utils/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const place = body?.place;

    if (!place?.id || !place?.name_zh || !place?.name_en || !place?.lat || !place?.lng) {
      return NextResponse.json(
        { error: 'Invalid place payload' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const placesCollection = db.collection<PlaceDocument>('places');

    const now = new Date();
    const doc: PlaceDocument = {
      id: place.id,
      name_zh: place.name_zh,
      name_en: place.name_en,
      address_zh: place.address_zh || '',
      address_en: place.address_en || '',
      phone: place.phone || undefined,
      price_level: place.price_level ?? 4,
      rating: place.rating ?? 0,
      rating_count: place.rating_count ?? 0,
      lat: place.lat,
      lng: place.lng,
      location: {
        type: 'Point',
        coordinates: [place.lng, place.lat],
      },
      categories: place.categories || [],
      features: place.features || [],
      open_hours: place.open_hours || undefined,
      photos: place.photos || [],
      website: place.website || undefined,
      created_at: place.created_at ? new Date(place.created_at) : undefined,
      updated_at: now,
    };

    await placesCollection.updateOne(
      { id: place.id },
      {
        $set: doc,
        $setOnInsert: { created_at: now },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/places/save] Failed to upsert place:', error);
    return NextResponse.json(
      { error: 'Failed to save place' },
      { status: 500 }
    );
  }
}

