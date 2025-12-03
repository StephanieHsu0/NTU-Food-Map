import { Place, FilterParams, RouletteRequest } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchPlaces(params: FilterParams): Promise<Place[]> {
  const queryParams = new URLSearchParams();
  
  if (params.lat) queryParams.append('lat', params.lat.toString());
  if (params.lng) queryParams.append('lng', params.lng.toString());
  if (params.radius) queryParams.append('radius', params.radius.toString());
  if (params.price_max) queryParams.append('price_max', params.price_max.toString());
  if (params.rating_min) queryParams.append('rating_min', params.rating_min.toString());
  if (params.categories) {
    params.categories.forEach(cat => queryParams.append('categories[]', cat));
  }
  if (params.features) {
    params.features.forEach(feat => queryParams.append('features[]', feat));
  }
  if (params.open_now !== undefined) {
    queryParams.append('open_now', params.open_now.toString());
  }

  const response = await fetch(`${API_URL}/api/places?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch places');
  }
  return response.json();
}

export async function fetchPlace(id: string): Promise<Place> {
  const response = await fetch(`${API_URL}/api/places/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch place');
  }
  return response.json();
}

export async function spinRoulette(request: RouletteRequest): Promise<Place> {
  const response = await fetch(`${API_URL}/api/roulette`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error('Failed to spin roulette');
  }
  return response.json();
}

