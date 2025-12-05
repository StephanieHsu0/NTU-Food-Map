import { Place } from './types';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY || '';

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert Google Places price level to our format (1-4)
// Google: 0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive
// Our system: 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive
function convertPriceLevel(priceLevel?: number): number {
  if (priceLevel === undefined || priceLevel === null) {
    // If no price level, default to 4 (most inclusive)
    return 4;
  }
  // Google uses 0-4, we use 1-4
  // Map Google's 0 (Free) to our 1 (Inexpensive)
  return priceLevel === 0 ? 1 : priceLevel;
}

// Get place name at a specific location using reverse geocoding
export async function getPlaceNameAtLocation(
  lat: number,
  lng: number
): Promise<string | null> {
  if (typeof window === 'undefined' || !window.google || !window.google.maps) {
    console.warn('Google Maps API not available');
    return null;
  }

  try {
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('Timeout getting place name');
          resolve(null);
        }
      }, 10000); // 10 second timeout

      // First, try nearby search to find establishments
      const placesService = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      placesService.nearbySearch(
        {
          location: { lat, lng },
          radius: 50, // Small radius to find exact place
          type: 'establishment',
        },
        (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length > 0
          ) {
            // Find the closest place
            let closestPlace = results[0];
            let minDistance = Infinity;

            results.forEach((place) => {
              if (place.geometry?.location) {
                const placeLat = place.geometry.location.lat();
                const placeLng = place.geometry.location.lng();
                const distance = calculateDistance(lat, lng, placeLat, placeLng);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestPlace = place;
                }
              }
            });

            // If we found a place very close (within 30m), use its name
            if (minDistance < 30 && closestPlace.name) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                console.log('Found place name from nearby search:', closestPlace.name);
                resolve(closestPlace.name);
              }
              return;
            }
          }

          // Fallback to geocoding
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat, lng } },
            (geocodeResults, geocodeStatus) => {
              if (resolved) return;
              
              if (
                geocodeStatus === window.google.maps.GeocoderStatus.OK &&
                geocodeResults &&
                geocodeResults.length > 0
              ) {
                const result = geocodeResults[0];
                
                // Try to get place name from place_id if available
                if (result.place_id) {
                  const service = new window.google.maps.places.PlacesService(
                    document.createElement('div')
                  );

                  service.getDetails(
                    {
                      placeId: result.place_id,
                      fields: ['name', 'formatted_address', 'types'],
                    },
                    (place, placeStatus) => {
                      if (resolved) return;
                      
                      if (
                        placeStatus === window.google.maps.places.PlacesServiceStatus.OK &&
                        place &&
                        place.name
                      ) {
                        // Found a place name from place details
                        resolved = true;
                        clearTimeout(timeout);
                        console.log('Found place name from place details:', place.name);
                        resolve(place.name);
                        return;
                      }
                      
                      // Fallback: try to extract name from address components
                      const addressComponents = result.address_components || [];
                      for (const component of addressComponents) {
                        if (
                          component.types.includes('establishment') ||
                          component.types.includes('point_of_interest') ||
                          component.types.includes('premise') ||
                          component.types.includes('subpremise')
                        ) {
                          resolved = true;
                          clearTimeout(timeout);
                          console.log('Found place name from address component:', component.long_name);
                          resolve(component.long_name);
                          return;
                        }
                      }
                      
                      // Last resort: use formatted address (but try to extract a meaningful part)
                      const formattedAddress = result.formatted_address || '';
                      // Try to extract street name or building name
                      const streetNumber = addressComponents.find(c => c.types.includes('street_number'));
                      const route = addressComponents.find(c => c.types.includes('route'));
                      const sublocality = addressComponents.find(c => c.types.includes('sublocality'));
                      
                      if (streetNumber && route) {
                        resolved = true;
                        clearTimeout(timeout);
                        const streetName = `${streetNumber.long_name} ${route.long_name}`;
                        console.log('Using street name:', streetName);
                        resolve(streetName);
                        return;
                      }
                      
                      if (sublocality) {
                        resolved = true;
                        clearTimeout(timeout);
                        console.log('Using sublocality:', sublocality.long_name);
                        resolve(sublocality.long_name);
                        return;
                      }
                      
                      resolved = true;
                      clearTimeout(timeout);
                      console.log('Using formatted address:', formattedAddress);
                      resolve(formattedAddress);
                    }
                  );
                } else {
                  // No place_id, try to extract from address components
                  const addressComponents = result.address_components || [];
                  for (const component of addressComponents) {
                    if (
                      component.types.includes('establishment') ||
                      component.types.includes('point_of_interest') ||
                      component.types.includes('premise') ||
                      component.types.includes('subpremise')
                    ) {
                      resolved = true;
                      clearTimeout(timeout);
                      console.log('Found place name from address component (no place_id):', component.long_name);
                      resolve(component.long_name);
                      return;
                    }
                  }
                  
                  // Use a meaningful part of the address
                  const route = addressComponents.find(c => c.types.includes('route'));
                  const sublocality = addressComponents.find(c => c.types.includes('sublocality'));
                  
                  if (route) {
                    resolved = true;
                    clearTimeout(timeout);
                    console.log('Using route:', route.long_name);
                    resolve(route.long_name);
                    return;
                  }
                  
                  if (sublocality) {
                    resolved = true;
                    clearTimeout(timeout);
                    console.log('Using sublocality (no place_id):', sublocality.long_name);
                    resolve(sublocality.long_name);
                    return;
                  }
                  
                  resolved = true;
                  clearTimeout(timeout);
                  console.log('Using formatted address (no place_id):', result.formatted_address);
                  resolve(result.formatted_address);
                }
              } else {
                // Geocoding failed
                resolved = true;
                clearTimeout(timeout);
                console.warn('Geocoding failed:', geocodeStatus);
                resolve(null);
              }
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Error getting place name:', error);
    return null;
  }
}

// Search nearby places using Google Places API
export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number,
  filters: {
    rating_min?: number;
    price_max?: number;
    type?: string;
  } = {}
): Promise<Place[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API Key not configured');
  }

  // Wait for Google Maps API to be loaded
  if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
    throw new Error('Google Maps API not loaded. Please wait for the map to load first.');
  }

  try {
    // Use Places API Nearby Search
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    // Food-related place types
    const foodTypes = [
      'restaurant',
      'food',
      'cafe',
      'meal_takeaway',
      'bakery',
      'bar',
      'meal_delivery',
    ];

    const request: google.maps.places.PlaceSearchRequest = {
      location: new window.google.maps.LatLng(lat, lng),
      radius: radius,
      type: foodTypes[0], // Use restaurant as primary type
      // Note: Google Places API only accepts one type at a time
      // We'll filter by types in getPlaceDetails
    };

    return new Promise((resolve, reject) => {
      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          // Get detailed information for each place
          const placePromises = results
            .slice(0, 20) // Limit to 20 places
            .map((result) => 
              getPlaceDetails(result.place_id!, lat, lng, filters)
                .catch((error) => {
                  // Skip places that don't match filters or fail to load
                  console.warn(`Skipping place ${result.place_id}:`, error);
                  return null;
                })
            );

          Promise.all(placePromises)
            .then((places) => {
              // Filter out null results first
              let validPlaces = places.filter((place): place is Place => place !== null);
              console.log(`Total valid places before filtering: ${validPlaces.length}`);
              
              // Log ratings for debugging
              if (filters.rating_min !== undefined && filters.rating_min > 0) {
                console.log(`Applying rating filter: minimum rating = ${filters.rating_min}`);
                validPlaces.forEach(place => {
                  console.log(`Place: ${place.name_zh}, Rating: ${place.rating || 'N/A'}`);
                });
              }
              
              // Apply additional filters
              let filteredPlaces = validPlaces.filter((place) => {
                // Rating filter: >= minimum rating
                // Only filter places that have a rating and it's below minimum
                // Places without ratings (undefined or 0) are included
                if (filters.rating_min !== undefined && filters.rating_min > 0) {
                  // Only filter if place has a valid rating (not undefined and > 0)
                  if (place.rating !== undefined && place.rating > 0 && place.rating < filters.rating_min) {
                    console.log(`Filtered out place ${place.name_zh} - rating ${place.rating} < ${filters.rating_min}`);
                    return false;
                  }
                }
                // Price filter: <= maximum price level
                if (filters.price_max !== undefined) {
                  if (place.price_level > filters.price_max) {
                    console.log(`Filtered out place ${place.name_zh} - price ${place.price_level} > ${filters.price_max}`);
                    return false;
                  }
                }
                return true;
              });
              
              console.log(`Places after filtering: ${filteredPlaces.length} (rating_min: ${filters.rating_min}, price_max: ${filters.price_max})`);

              // Sort by distance
              filteredPlaces.sort((a, b) => {
                const distA = a.distance_m || Infinity;
                const distB = b.distance_m || Infinity;
                return distA - distB;
              });

              resolve(filteredPlaces);
            })
            .catch(reject);
        } else {
          reject(new Error(`Places API error: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error searching nearby places:', error);
    throw error;
  }
}

// Get detailed information for a place
async function getPlaceDetails(
  placeId: string,
  userLat: number,
  userLng: number,
  filters: { rating_min?: number; price_max?: number }
): Promise<Place> {
  return new Promise((resolve, reject) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: placeId,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'geometry',
        'rating',
        'user_ratings_total',
        'price_level',
        'types',
        'opening_hours',
        'photos',
        'website',
        'formatted_phone_number',
      ],
    };

    service.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        // Filter: Only include food/restaurant related places
        const foodRelatedTypes = [
          'restaurant',
          'food',
          'cafe',
          'meal_takeaway',
          'bakery',
          'bar',
          'meal_delivery',
          'night_club',
        ];
        
        const placeTypes = place.types || [];
        const hasFoodType = placeTypes.some((type) => 
          foodRelatedTypes.some((foodType) => type.includes(foodType))
        );
        
        if (!hasFoodType) {
          reject(new Error('Place is not a food/restaurant establishment'));
          return;
        }

        // Get rating - only filter if rating exists and is below minimum
        const placeRating = place.rating ?? 0;
        
        // Get price level
        const placePriceLevel = convertPriceLevel(place.price_level);
        
        // Note: We'll apply filters later in searchNearbyPlaces to avoid rejecting places
        // that might have missing data but could still be valid

        const lat = place.geometry?.location?.lat() || 0;
        const lng = place.geometry?.location?.lng() || 0;
        const distance_m = calculateDistance(userLat, userLng, lat, lng);

        // Extract categories from types (filter out non-food types)
        const categories = placeTypes
          .filter((type) => {
            // Exclude generic types
            if (
              type.startsWith('point_of_interest') ||
              type === 'establishment' ||
              type === 'store'
            ) {
              return false;
            }
            // Include food-related types
            return foodRelatedTypes.some((foodType) => type.includes(foodType)) ||
              type.includes('restaurant') ||
              type.includes('food');
          })
          .slice(0, 5);

        // Convert opening hours format
        const openHours: { [key: string]: string[] } = {};
        if (place.opening_hours?.weekday_text) {
          place.opening_hours.weekday_text.forEach((text) => {
            const match = text.match(/^([^:]+):\s*(.+)$/);
            if (match) {
              const day = match[1];
              const hours = match[2].split(',').map((h) => h.trim());
              openHours[day] = hours;
            }
          });
        }

        // Get photo URLs
        const photos = place.photos?.slice(0, 5).map((photo) => {
          return photo.getUrl({ maxWidth: 400, maxHeight: 400 });
        }) || [];

        const placeData: Place = {
          id: place.place_id || '',
          name_zh: place.name || '',
          name_en: place.name || '',
          address_zh: place.formatted_address || '',
          address_en: place.formatted_address || '',
          phone: place.formatted_phone_number,
          price_level: placePriceLevel,
          rating: placeRating,
          rating_count: place.user_ratings_total || 0,
          lat: lat,
          lng: lng,
          categories: categories,
          features: [],
          open_hours: Object.keys(openHours).length > 0 ? openHours : undefined,
          photos: photos.length > 0 ? photos : undefined,
          website: place.website,
          distance_m: Math.round(distance_m),
        };

        resolve(placeData);
      } else {
        reject(new Error(`Failed to get place details: ${status}`));
      }
    });
  });
}

