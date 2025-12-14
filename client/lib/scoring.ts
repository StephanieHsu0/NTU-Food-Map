import { Place, ScoreBreakdown } from '@/utils/types';

interface ScoringWeights {
  rating: number;
  distance: number;
  popularity: number;
  open: number;
  context: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  rating: 0.3,
  distance: 0.25,
  popularity: 0.2,
  open: 0.15,
  context: 0.1,
};

/**
 * Calculate recommendation score for a place
 */
export function calculateScore(
  place: Place,
  userLat: number,
  userLng: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): { score: number; breakdown: ScoreBreakdown } {
  // Rating score (0-5 normalized to 0-1)
  const ratingScore = place.rating / 5;

  // Distance score (inverse, closer = higher score)
  // Using exponential decay: score = e^(-distance/1000)
  const distanceKm = (place.distance_m || 0) / 1000;
  const distanceScore = Math.exp(-distanceKm / 2); // Decay factor: 2km

  // Popularity score (based on rating count, normalized)
  // Using log scale: score = log(rating_count + 1) / log(max_count + 1)
  const maxRatingCount = 10000; // Assume max is 10000
  const popularityScore = Math.min(
    Math.log(place.rating_count + 1) / Math.log(maxRatingCount + 1),
    1
  );

  // Open status score (1 if open, 0.3 if closed, 0.5 if unknown)
  const openScore = place.is_open === true ? 1 : place.is_open === false ? 0.3 : 0.5;

  // Context score (based on features and categories)
  // Higher score for vegetarian options, wifi, etc.
  let contextScore = 0.5; // Base score
  if (place.features.includes('vegetarian')) {
    contextScore += 0.15;
  }
  if (place.features.includes('wifi')) {
    contextScore += 0.1;
  }
  contextScore = Math.min(contextScore, 1);

  // Calculate weighted total
  const total =
    ratingScore * weights.rating +
    distanceScore * weights.distance +
    popularityScore * weights.popularity +
    openScore * weights.open +
    contextScore * weights.context;

  const breakdown: ScoreBreakdown = {
    rating: ratingScore * weights.rating * 10, // Scale to 0-10 for display
    distance: distanceScore * weights.distance * 10,
    popularity: popularityScore * weights.popularity * 10,
    open: openScore * weights.open * 10,
    context: contextScore * weights.context * 10,
    total: total * 10,
  };

  return { score: total, breakdown };
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
export function checkIfOpen(openHours: { [key: string]: string[] }): boolean {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return openHours[today] !== undefined && openHours[today].length > 0;
}

