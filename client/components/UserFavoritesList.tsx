'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlaceCard from './PlaceCard';
import { Place } from '@/utils/types';
import { getPlaceDetails } from '@/utils/googlePlaces';

interface Favorite {
  id: string;
  place_id: string;
  note: string | null;
  created_at: string;
}

interface UserFavoritesListProps {
  userId: string;
}

export default function UserFavoritesList({ userId }: UserFavoritesListProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [places, setPlaces] = useState<Map<string, Place>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites');
      
      if (!response.ok) {
        throw new Error('Failed to load favorites');
      }

      const favoritesData = await response.json();
      setFavorites(favoritesData);

      // Load place details for each favorite using Google Places JavaScript API
      // This works correctly (same method as place detail page)
      const placePromises = favoritesData.map(async (fav: Favorite) => {
        try {
          // Check if it's a Google Places ID
          if (fav.place_id.startsWith('ChIJ') || fav.place_id.startsWith('ChlJ') || fav.place_id.length > 20) {
            // Wait for Google Maps API to be loaded
            if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
              const placeData = await getPlaceDetails(fav.place_id, 25.0170, 121.5395);
              if (placeData) {
                return { placeId: fav.place_id, place: placeData };
              }
            } else {
              // If Google Maps API not loaded yet, wait a bit and try again
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
                const placeData = await getPlaceDetails(fav.place_id, 25.0170, 121.5395);
                if (placeData) {
                  return { placeId: fav.place_id, place: placeData };
                }
              }
            }
          } else {
            // For non-Google Places IDs, try the API endpoint
            const placeResponse = await fetch(`/api/places/${fav.place_id}?lat=25.0170&lng=121.5395`);
            if (placeResponse.ok) {
              const placeData = await placeResponse.json();
              return { placeId: fav.place_id, place: placeData };
            }
          }
        } catch (error) {
          console.error(`Error loading place ${fav.place_id}:`, error);
        }
        return null;
      });

      const placeResults = await Promise.all(placePromises);
      const placesMap = new Map<string, Place>();
      
      placeResults.forEach((result) => {
        if (result) {
          placesMap.set(result.placeId, result.place);
        }
      });

      setPlaces(placesMap);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-text-secondary">{t('common.loading')}</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">{t('profile.favorites.noFavorites')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {favorites.map((favorite) => {
        const place = places.get(favorite.place_id);
        
        if (!place) {
          return (
            <div
              key={favorite.id}
              className="border border-divider rounded-lg p-4"
            >
              <p className="text-text-secondary">
                {t('profile.favorites.loadingPlace')} ({favorite.place_id})
              </p>
            </div>
          );
        }

        return (
          <div
            key={favorite.id}
            className="border border-divider rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <Link href={`/${locale}/place/${favorite.place_id}`}>
              <PlaceCard place={place} />
            </Link>
            {favorite.note && (
              <div className="mt-3 pt-3 border-t border-divider">
                <p className="text-sm text-text-secondary">
                  <span className="font-medium">{t('profile.favorites.note')}:</span>{' '}
                  {favorite.note}
                </p>
              </div>
            )}
            <p className="text-xs text-text-secondary mt-2">
              {t('profile.favorites.addedOn')}: {new Date(favorite.created_at).toLocaleDateString(locale)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

