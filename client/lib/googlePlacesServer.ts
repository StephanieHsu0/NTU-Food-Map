/**
 * Server-side Google Places API helper
 * Uses Google Places API REST API (not JavaScript API)
 */

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY || '';

interface GooglePlaceDetailsResponse {
  result: {
    place_id: string;
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    types?: string[];
    opening_hours?: {
      weekday_text?: string[];
    };
    photos?: Array<{
      photo_reference: string;
    }>;
    website?: string;
    geometry?: {
      location: {
        lat: number;
        lng: number;
      };
    };
  };
  status: string;
}

/**
 * Get place details from Google Places API (server-side)
 */
export async function getPlaceDetailsFromGoogle(
  placeId: string
): Promise<{ name_zh: string | null; name_en: string | null } | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured for server-side use');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,formatted_address&key=${GOOGLE_PLACES_API_KEY}&language=zh-TW`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Places API error: ${response.status}`);
      return null;
    }

    const data: GooglePlaceDetailsResponse = await response.json();
    
    if (data.status === 'OK' && data.result) {
      // Google Places API returns name in the requested language
      // We'll use the same name for both zh and en for now
      const name = data.result.name || null;
      return {
        name_zh: name,
        name_en: name, // Could fetch again with language=en if needed
      };
    } else {
      console.warn(`[Google Places API] API returned status: ${data.status} for place ${placeId}`);
      return null;
    }
  } catch (error) {
    console.error(`[Google Places API] Exception fetching place ${placeId}:`, error);
    if (error instanceof Error) {
      console.error(`[Google Places API] Error message: ${error.message}`);
    }
    return null;
  }
}

/**
 * Get full place information from Google Places API (server-side)
 */
export async function getFullPlaceDetailsFromGoogle(
  placeId: string,
  userLat: number = 25.0170,
  userLng: number = 121.5395
): Promise<any | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('[Google Places API] API key not configured. Check GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY environment variable.');
    return null;
  }

  try {
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'formatted_phone_number',
      'rating',
      'user_ratings_total',
      'price_level',
      'types',
      'opening_hours',
      'photos',
      'website',
      'geometry',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}&language=zh-TW`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error(`[Google Places API] HTTP error ${response.status} for place ${placeId}:`, errorText);
      return null;
    }

    const data: GooglePlaceDetailsResponse = await response.json();
    
    if (data.status === 'OK' && data.result) {
      console.log(`[Google Places API] Successfully fetched place ${placeId}: ${data.result.name}`);
      return data.result;
    } else {
      console.warn(`[Google Places API] API returned status: ${data.status} for place ${placeId}`);
      if (data.status === 'REQUEST_DENIED') {
        console.error('[Google Places API] Request denied. Check API key permissions and billing.');
      } else if (data.status === 'INVALID_REQUEST') {
        console.error(`[Google Places API] Invalid request for place ${placeId}. Check place_id format.`);
      } else if (data.status === 'NOT_FOUND') {
        console.warn(`[Google Places API] Place ${placeId} not found in Google Places.`);
      }
      return null;
    }
  } catch (error) {
    console.error(`[Google Places API] Exception fetching place ${placeId}:`, error);
    if (error instanceof Error) {
      console.error(`[Google Places API] Error message: ${error.message}`);
      console.error(`[Google Places API] Error stack: ${error.stack}`);
    }
    return null;
  }
}

