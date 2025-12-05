'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Sidebar from '@/components/Sidebar';
import Filters from '@/components/Filters';
import { fetchPlaces } from '@/utils/api';
import { Place, FilterParams } from '@/utils/types';

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function HomePage() {
  const t = useTranslations();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    lat: 25.0170, // NTU approximate center
    lng: 121.5395,
    radius: 2000,
    rating_min: 0,
    price_max: 4,
  });

  useEffect(() => {
    loadPlaces();
  }, [filters]);

  const loadPlaces = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading places with filters:', filters);
      const data = await fetchPlaces(filters);
      console.log('Loaded places:', data.length);
      setPlaces(data);
      setFilteredPlaces(data);
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
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4">{t('filters.title')}</h2>
          <Filters filters={filters} onChange={handleFilterChange} />
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
        />
      </div>
    </div>
  );
}

