'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Sidebar from '@/components/Sidebar';
import Filters from '@/components/Filters';
import { fetchPlaces } from '@/utils/api';
import { searchNearbyPlaces, getPlaceNameAtLocation } from '@/utils/googlePlaces';
import { Place, FilterParams } from '@/utils/types';

// Dynamically import Map component to avoid SSR issues with Google Maps
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function HomePage() {
  const t = useTranslations();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  // Base point (點A) - the center point for search, separate from selectedLocation
  const [basePoint, setBasePoint] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useGooglePlaces, setUseGooglePlaces] = useState(true); // Toggle between Google Places and database
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({
    lat: 25.0170, // NTU approximate center
    lng: 121.5395,
    radius: 2000,
    rating_min: 0,
    price_max: 4,
  });

  useEffect(() => {
    // Load places when filters change
    // For Google Places: wait for map to load, then use basePoint or default location
    // For database: load immediately
    if (!useGooglePlaces) {
      // Database mode: load immediately
      loadPlaces();
    } else if (mapLoaded) {
      // Google Places mode: wait for map to load, then load places
      // Use basePoint if available, otherwise use default location from filters
      loadPlaces();
    }
  }, [filters, useGooglePlaces, basePoint, mapLoaded]);

  const loadPlaces = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading places with filters:', filters);
      
      // Use Google Places API if enabled and location is selected (or use default location)
      // Use basePoint as the search center, fallback to filters or default
      const searchLocation = basePoint || { lat: filters.lat || 25.0170, lng: filters.lng || 121.5395 };
      if (useGooglePlaces && mapLoaded) {
        try {
          const data = await searchNearbyPlaces(
            searchLocation.lat,
            searchLocation.lng,
            filters.radius || 2000,
            {
              rating_min: filters.rating_min,
              price_max: filters.price_max,
              open_now: filters.open_now,
              categories: filters.categories,
            }
          );
          console.log('Loaded places from Google Places:', data.length);
          console.log('Places data:', data);
          setPlaces(data);
          setFilteredPlaces(data);
        } catch (placesError) {
          console.warn('Google Places API failed, falling back to database:', placesError);
          // Fallback to database if Google Places fails
          const data = await fetchPlaces(filters);
          console.log('Loaded places from database (fallback):', data.length);
          setPlaces(data);
          setFilteredPlaces(data);
        }
      } else {
        // Use database
        const data = await fetchPlaces(filters);
        console.log('Loaded places from database:', data.length);
        setPlaces(data);
        setFilteredPlaces(data);
      }
    } catch (error) {
      console.error('Failed to load places:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load places';
      setError(errorMessage);
      setPlaces([]);
      setFilteredPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    // Don't change basePoint when selecting a place - basePoint should remain unchanged
    // Only update map center for viewing, but keep basePoint for search
    setFilters({
      ...filters,
      lat: place.lat,
      lng: place.lng,
    });
  };

  const handleMapClick = async (lat: number, lng: number) => {
    console.log('Map clicked at:', lat, lng);
    
    // Set basePoint (點A) immediately with coordinates
    setBasePoint({ lat, lng });
    // Also set selectedLocation for display purposes
    setSelectedLocation({ lat, lng });
    
    // Get place name at this location asynchronously
    if (mapLoaded) {
      try {
        const placeName = await getPlaceNameAtLocation(lat, lng);
        console.log('Place name at location:', placeName);
        // Update basePoint and selectedLocation with name if found
        if (placeName) {
          setBasePoint({ lat, lng, name: placeName });
          setSelectedLocation({ lat, lng, name: placeName });
        }
      } catch (error) {
        console.error('Failed to get place name:', error);
      }
    }
    
    // Update filters with new location for search
    setFilters({
      ...filters,
      lat,
      lng,
    });
  };

  const handleLocationSelect = async (lat: number, lng: number, name?: string) => {
    console.log('Location selected from marker (view nearby):', lat, lng, name);
    // This is called when user clicks "查看附近餐廳" button
    // Set this as the new basePoint
    setBasePoint({ lat, lng, name });
    setSelectedLocation({ lat, lng, name });
    // Update filters with new location for search
    setFilters({
      ...filters,
      lat,
      lng,
    });
  };

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  const handleReset = () => {
    console.log('🔄 Reset button clicked');
    // Reset basePoint and selected location
    setBasePoint(null);
    setSelectedLocation(null);
    // Reset selected place
    setSelectedPlace(null);
    // Reset filters to default values
    const defaultFilters: FilterParams = {
      lat: 25.0170,
      lng: 121.5395,
      radius: 2000,
      rating_min: 0,
      price_max: 4,
    };
    setFilters(defaultFilters);
    // Clear places
    setPlaces([]);
    setFilteredPlaces([]);
    console.log('✅ Reset completed, basePoint:', null, 'selectedLocation:', null, 'selectedPlace:', null);
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('filters.title')}</h2>
          {useGooglePlaces && !basePoint && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              💡 {t('map.clickToSelectCenter')}
            </p>
          </div>
          )}
          {useGooglePlaces && basePoint && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✓ {t('map.basePoint')}：{basePoint.name || `(${basePoint.lat.toFixed(4)}, ${basePoint.lng.toFixed(4)})`}
            </p>
          </div>
          )}
          <Filters 
            filters={filters} 
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>
        <Sidebar
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onPlaceSelect={handlePlaceSelect}
          loading={loading}
          error={error}
        />
      </div>
      <div className="flex-1 relative">
        <Map
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onPlaceSelect={handlePlaceSelect}
          center={[filters.lat || 25.0170, filters.lng || 121.5395]}
          onMapClick={handleMapClick}
          selectedLocation={selectedLocation}
          basePoint={basePoint}
          onMapLoad={handleMapLoad}
          radius={filters.radius}
          onLocationSelect={handleLocationSelect}
        />
      </div>
    </div>
  );
}

