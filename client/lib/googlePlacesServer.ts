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
      console.warn(`Google Places API returned status: ${data.status} for place ${placeId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching place details from Google Places API for ${placeId}:`, error);
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
    console.warn('Google Places API key not configured for server-side use');
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
      console.error(`Google Places API error: ${response.status}`);
      return null;
    }

    const data: GooglePlaceDetailsResponse = await response.json();
    
    if (data.status === 'OK' && data.result) {
      return data.result;
    } else {
      console.warn(`Google Places API returned status: ${data.status} for place ${placeId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching place details from Google Places API for ${placeId}:`, error);
    return null;
  }
}

