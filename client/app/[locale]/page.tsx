'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Sidebar from '@/components/Sidebar';
import Filters from '@/components/Filters';
import RouletteModal from '@/components/RouletteModal';
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
  const [rouletteModalOpen, setRouletteModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({
    lat: 25.0170, // NTU approximate center
    lng: 121.5395,
    radius: 2000,
    rating_min: 0,
    price_max: 4,
  });
  
  // Use ref to prevent multiple simultaneous loads
  const loadingRef = useRef(false);

  const loadPlaces = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      console.log('⏸️ Load already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
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
      loadingRef.current = false;
    }
  }, [filters, useGooglePlaces, basePoint, mapLoaded]);

  useEffect(() => {
    // Load places when filters change
    // For Google Places: wait for map to load, then use basePoint or default location
    // For database: load immediately
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      if (!useGooglePlaces) {
        // Database mode: load immediately
        await loadPlaces();
      } else if (mapLoaded) {
        // Google Places mode: wait for map to load, then load places
        // Use basePoint if available, otherwise use default location from filters
        await loadPlaces();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [loadPlaces, useGooglePlaces, mapLoaded]);

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
    console.log('✅ Map loaded');
    setMapLoaded(true);
  };
  
  // Reset map loaded state when component unmounts or route changes
  useEffect(() => {
    return () => {
      // Reset map loaded state when leaving the page
      setMapLoaded(false);
    };
  }, []);

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
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] bg-background">
      {/* Sidebar: Full width on mobile, 1/3 width on tablet/desktop */}
      <div className="w-full md:w-1/3 border-r border-divider bg-white flex flex-col h-[50vh] md:h-auto md:overflow-y-auto">
        {/* Filters Section */}
        <div className="p-4 md:p-6 border-b border-divider bg-white flex-shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-text-primary">{t('filters.title')}</h2>
            <button
              onClick={() => setRouletteModalOpen(true)}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm md:text-base"
            >
              <span className="text-base md:text-lg">🎰</span>
              <span className="hidden sm:inline">{t('roulette.title')}</span>
            </button>
          </div>
          {useGooglePlaces && !basePoint && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                💡 {t('map.clickToSelectCenter')}
              </p>
            </div>
          )}
          {useGooglePlaces && basePoint && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
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
        {/* Places List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <Sidebar
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onPlaceSelect={handlePlaceSelect}
            loading={loading}
            error={error}
          />
        </div>
      </div>
      {/* Map: Full width on mobile, 2/3 width on tablet/desktop */}
      <div className="w-full md:flex-1 relative bg-background h-[50vh] md:h-auto flex-shrink-0">
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

      {/* Roulette Modal */}
      <RouletteModal
        isOpen={rouletteModalOpen}
        onClose={() => setRouletteModalOpen(false)}
        filters={filters}
        filteredPlaces={filteredPlaces}
        onPlaceSelect={handlePlaceSelect}
      />
    </div>
  );
}

