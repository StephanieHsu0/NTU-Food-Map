import { Place, ScoreBreakdown } from './types';

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
 * Sort places by recommendation score
 */
export function sortByScore(places: Place[]): Place[] {
  return places.sort((a, b) => (b.score || 0) - (a.score || 0));
}

