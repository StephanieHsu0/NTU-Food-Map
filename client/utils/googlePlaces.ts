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
// Map Chinese category names to Google Places API types
const categoryToGoogleType: { [key: string]: string[] } = {
  '餐廳': ['restaurant'],
  '咖啡廳': ['cafe', 'coffee_shop'],
  '小吃': ['meal_takeaway', 'food'],
  '夜市': ['night_market', 'food'],
  '速食': ['meal_takeaway', 'fast_food_restaurant'],
  '日式': ['restaurant'], // Will filter by category name in place.categories
  '中式': ['restaurant'], // Will filter by category name in place.categories
  '西式': ['restaurant'], // Will filter by category name in place.categories
};

// Keywords for cuisine types (for checking in reviews)
const cuisineKeywords: { [key: string]: string[] } = {
  '日式': [
    // Chinese keywords
    '日式', '日本', '日料', '和食', '壽司', '拉麵', '丼飯', '天婦羅', '居酒屋', '燒肉', '燒烤', '日式料理',
    // English keywords
    'japanese', 'sushi', 'ramen', 'donburi', 'tempura', 'izakaya', 'yakitori', 'teriyaki', 'sashimi', 'udon', 'soba', 'tonkatsu'
  ],
  '中式': [
    // Chinese keywords
    '中式', '中國', '中餐', '川菜', '粵菜', '湘菜', '魯菜', '台菜', '台灣', '小籠包', '炒飯', '炒麵', '火鍋', '麻辣',
    // English keywords
    'chinese', 'szechuan', 'cantonese', 'dim sum', 'dumpling', 'wonton', 'hot pot', 'kung pao', 'mapo tofu', 'peking duck'
  ],
  '西式': [
    // Chinese keywords
    '西式', '西餐', '義式', '義大利', '法式', '法國', '美式', '美國', '牛排', '義大利麵', '披薩', '漢堡', '義式料理', '法式料理',
    // English keywords
    'western', 'italian', 'french', 'american', 'steak', 'pasta', 'pizza', 'burger', 'spaghetti', 'risotto', 'carbonara', 'bolognese', 'bruschetta', 'tiramisu', 'croissant', 'baguette', 'wine', 'bistro'
  ],
};

export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number,
  filters: {
    rating_min?: number;
    price_max?: number;
    type?: string;
    open_now?: boolean;
    categories?: string[];
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

    // If categories are specified, try to use the first matching Google type
    let searchType = foodTypes[0]; // Default to restaurant
    if (filters.categories && filters.categories.length > 0) {
      // Get the first category and find its Google type
      const firstCategory = filters.categories[0];
      const googleTypes = categoryToGoogleType[firstCategory];
      if (googleTypes && googleTypes.length > 0) {
        searchType = googleTypes[0];
      }
    }

    const request: google.maps.places.PlaceSearchRequest = {
      location: new window.google.maps.LatLng(lat, lng),
      radius: radius,
      type: searchType,
      // Note: Google Places API only accepts one type at a time
      // We'll filter by category names in the filter logic below
      openNow: filters.open_now || false, // Filter by open status if requested
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
                // Category filter: check if place matches selected categories
                if (filters.categories && filters.categories.length > 0) {
                  // Check if place's categories match any of the selected categories
                  // Place categories are Google Places types (e.g., 'restaurant', 'cafe')
                  // Selected categories are Chinese names (e.g., '餐廳', '咖啡廳')
                  const placeCategories = place.categories || [];
                  const selectedCategories = filters.categories;
                  
                  // Map selected Chinese categories to Google types
                  const selectedGoogleTypes = new Set<string>();
                  selectedCategories.forEach(cat => {
                    const googleTypes = categoryToGoogleType[cat] || [];
                    googleTypes.forEach(type => selectedGoogleTypes.add(type));
                  });
                  
                  // For cuisine-specific categories (日式、中式、西式), check place name or categories
                  const cuisineCategories = ['日式', '中式', '西式'];
                  const hasCuisineFilter = selectedCategories.some(cat => cuisineCategories.includes(cat));
                  
                  if (hasCuisineFilter) {
                    // For cuisine filters, check if place name, categories, or reviews contain cuisine keywords
                    const name = (place.name_zh || place.name_en || '').toLowerCase();
                    
                    // Check reviews text if available
                    const reviewsText = place.reviews && place.reviews.length > 0
                      ? place.reviews.map(r => (r.text || '').toLowerCase()).join(' ')
                      : '';
                    const allText = `${name} ${reviewsText}`.toLowerCase();
                    
                    const matchesCuisine = selectedCategories.some(cat => {
                      const keywords = cuisineKeywords[cat] || [];
                      if (keywords.length === 0) return false;
                      
                      // Check name and categories first
                      const nameMatch = keywords.some(keyword => 
                        name.includes(keyword.toLowerCase())
                      );
                      const categoryMatch = placeCategories.some(c => 
                        keywords.some(keyword => c.toLowerCase().includes(keyword.toLowerCase()))
                      );
                      
                      // Check reviews if name and category don't match
                      let reviewMatch = false;
                      if (!nameMatch && !categoryMatch && reviewsText) {
                        reviewMatch = keywords.some(keyword => 
                          reviewsText.includes(keyword.toLowerCase())
                        );
                      }
                      
                      return nameMatch || categoryMatch || reviewMatch;
                    });
                    
                    if (!matchesCuisine) {
                      console.log(`Filtered out place ${place.name_zh} - doesn't match cuisine filter (checked name, categories, and reviews)`);
                      return false;
                    }
                  } else {
                    // For general categories, check if place types match
                    const matchesCategory = placeCategories.some(placeCat => 
                      selectedGoogleTypes.has(placeCat) || 
                      Array.from(selectedGoogleTypes).some(selectedType => placeCat.includes(selectedType))
                    );
                    
                    if (!matchesCategory) {
                      console.log(`Filtered out place ${place.name_zh} - categories ${placeCategories.join(', ')} don't match ${selectedCategories.join(', ')}`);
                      return false;
                    }
                  }
                }
                // Open now filter: only include places that are currently open
                if (filters.open_now === true) {
                  // Check if place has opening hours and is currently open
                  if (place.is_open === false || (place.is_open === undefined && place.open_hours === undefined)) {
                    console.log(`Filtered out place ${place.name_zh} - not open now`);
                    return false;
                  }
                }
                return true;
              });
              
              console.log(`Places after filtering: ${filteredPlaces.length} (rating_min: ${filters.rating_min}, price_max: ${filters.price_max}, open_now: ${filters.open_now})`);

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
export async function getPlaceDetails(
  placeId: string,
  userLat: number,
  userLng: number,
  filters: { rating_min?: number; price_max?: number } = {}
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
        'reviews', // Add reviews field
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
        
        // Debug: log the raw data from Google Places API
        console.log('Google Places API raw data:', {
          name: place.name,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          price_level: place.price_level,
          converted_price_level: placePriceLevel,
          formatted_phone_number: place.formatted_phone_number,
          website: place.website,
          opening_hours: place.opening_hours,
          photos_count: place.photos?.length || 0,
        });
        
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

        // Process reviews (Google Places API returns up to 5 reviews)
        const reviews = place.reviews?.slice(0, 5).map((review) => ({
          author_name: review.author_name || '匿名',
          author_url: review.author_url,
          profile_photo_url: review.profile_photo_url,
          rating: review.rating || 0,
          relative_time_description: review.relative_time_description || '',
          text: review.text || '',
          time: review.time || 0,
        })) || [];

        // Determine if place is currently open
        // Use Google Places API's open_now if available, otherwise check opening hours
        let isOpen: boolean | undefined = undefined;
        if (place.opening_hours) {
          // Google Places API provides open_now property
          if (place.opening_hours.open_now !== undefined) {
            isOpen = place.opening_hours.open_now;
          } else if (Object.keys(openHours).length > 0) {
            // Fallback: check if there are opening hours for today
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            isOpen = openHours[today] !== undefined && openHours[today].length > 0;
          }
        }

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
          reviews: reviews.length > 0 ? reviews : undefined,
          is_open: isOpen,
        };

        console.log('Processed place data:', {
          name: placeData.name_zh,
          rating: placeData.rating,
          rating_count: placeData.rating_count,
          price_level: placeData.price_level,
          distance_m: placeData.distance_m,
          has_phone: !!placeData.phone,
          has_website: !!placeData.website,
          has_open_hours: !!placeData.open_hours,
          photos_count: placeData.photos?.length || 0,
        });

        resolve(placeData);
      } else {
        reject(new Error(`Failed to get place details: ${status}`));
      }
    });
  });
}

