import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { calculateScore, calculateDistance } from '@/lib/scoring';
import { Place, PlaceDocument } from '@/utils/types';

// Force dynamic rendering - this route uses searchParams which is dynamic
export const dynamic = 'force-dynamic';

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

    let doc = await placesCollection.findOne({ id });

    // If not found in database and it looks like a Google Places ID, try Google Places API
    if (!doc && (id.startsWith('ChIJ') || id.startsWith('ChlJ') || id.length > 20)) {
      console.log(`[Places API] Place ${id} not found in database, trying Google Places API...`);
      try {
        const { getFullPlaceDetailsFromGoogle } = await import('@/lib/googlePlacesServer');
        const googlePlace = await getFullPlaceDetailsFromGoogle(id, lat, lng);
        
        if (googlePlace) {
          // Convert Google Places API response to Place format
          const placeTypes = googlePlace.types || [];
          const foodRelatedTypes = ['restaurant', 'food', 'cafe', 'meal_takeaway', 'bakery', 'bar', 'meal_delivery'];
          const categories = placeTypes
            .filter((type: string) => 
              foodRelatedTypes.some((foodType) => type.includes(foodType)) ||
              type.includes('restaurant') ||
              type.includes('food')
            )
            .slice(0, 5);

          // Convert opening hours
          const openHours: { [key: string]: string[] } = {};
          if (googlePlace.opening_hours?.weekday_text) {
            googlePlace.opening_hours.weekday_text.forEach((text: string) => {
              const match = text.match(/^([^:]+):\s*(.+)$/);
              if (match) {
                const day = match[1];
                const hours = match[2].split(',').map((h: string) => h.trim());
                openHours[day] = hours;
              }
            });
          }

          // Convert price level (Google uses 0-4, we use 1-4)
          const priceLevel = googlePlace.price_level === 0 ? 1 : (googlePlace.price_level || 4);

          const place: Place = {
            id: googlePlace.place_id,
            name_zh: googlePlace.name || '',
            name_en: googlePlace.name || '', // Could fetch with language=en if needed
            address_zh: googlePlace.formatted_address || '',
            address_en: googlePlace.formatted_address || '',
            phone: googlePlace.formatted_phone_number || undefined,
            price_level: priceLevel,
            rating: googlePlace.rating || 0,
            rating_count: googlePlace.user_ratings_total || 0,
            lat: googlePlace.geometry?.location?.lat || lat,
            lng: googlePlace.geometry?.location?.lng || lng,
            categories: categories,
            features: [],
            open_hours: Object.keys(openHours).length > 0 ? openHours : undefined,
            photos: googlePlace.photos?.slice(0, 5).map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY}`
            ) || undefined,
            website: googlePlace.website || undefined,
            distance_m: Math.round(calculateDistance(
              lat,
              lng,
              googlePlace.geometry?.location?.lat || lat,
              googlePlace.geometry?.location?.lng || lng
            )),
          };

          // Calculate recommendation score
          const { score, breakdown } = calculateScore(place, lat, lng);
          place.score = score;
          place.score_breakdown = breakdown;

          return NextResponse.json(place);
        } else {
          console.warn(`[Places API] Google Places API returned null for place ${id}`);
          // Return minimal place object even if Google Places API returns null
          const minimalPlace: Place = {
            id: id,
            name_zh: null,
            name_en: null,
            address_zh: null,
            address_en: null,
            lat: lat,
            lng: lng,
            distance_m: 0,
            rating: 0,
            rating_count: 0,
            price_level: 0,
            categories: [],
            features: [],
          };
          return NextResponse.json(minimalPlace);
        }
      } catch (googleError) {
        console.error(`[Places API] Error fetching place ${id} from Google Places API:`, googleError);
        // Even if Google Places API fails, return a minimal place object so the frontend can display something
        // This allows the link to work even if we can't get the full details
        const minimalPlace: Place = {
          id: id,
          name_zh: null,
          name_en: null,
          address_zh: null,
          address_en: null,
          lat: lat,
          lng: lng,
          distance_m: 0,
          rating: 0,
          rating_count: 0,
          price_level: 0,
          categories: [],
          features: [],
        };
        return NextResponse.json(minimalPlace);
      }
    }

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

