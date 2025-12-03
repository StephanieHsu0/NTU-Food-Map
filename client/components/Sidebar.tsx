'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Place } from '@/utils/types';
import PlaceCard from './PlaceCard';
import Link from 'next/link';

interface SidebarProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
  loading: boolean;
}

export default function Sidebar({ places, selectedPlace, onPlaceSelect, loading }: SidebarProps) {
  const t = useTranslations();
  const locale = useLocale();

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        {t('common.loading')}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {t('common.noResults')}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {places.map((place) => (
        <div
          key={place.id}
          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedPlace?.id === place.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
          }`}
          onClick={() => onPlaceSelect(place)}
        >
          <PlaceCard place={place} />
          <Link
            href={`/${locale}/place/${place.id}`}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            {t('place.details')} →
          </Link>
        </div>
      ))}
    </div>
  );
}

