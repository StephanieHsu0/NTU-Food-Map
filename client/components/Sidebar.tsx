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
  error?: string | null;
}

export default function Sidebar({ places, selectedPlace, onPlaceSelect, loading, error }: SidebarProps) {
  const t = useTranslations();
  const locale = useLocale();

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-divider shadow-sm p-4 animate-pulse space-y-3"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2 mt-2">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-10" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-14" />
              <div className="h-6 bg-gray-200 rounded-full w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 font-semibold mb-2">錯誤</div>
        <div className="text-sm text-text-secondary">{error}</div>
        <div className="text-xs text-text-secondary mt-2">
          請檢查瀏覽器控制台以獲取更多資訊
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-text-secondary">{t('common.noResults')}</div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-divider">
      {places.map((place) => (
        <div
          key={place.id}
          className={`p-5 cursor-pointer bg-white transition-all duration-200 ${
            selectedPlace?.id === place.id 
              ? 'bg-white border-l-4 border-primary-600 shadow-sm' 
              : 'hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5'
          }`}
          onClick={() => onPlaceSelect(place)}
        >
          <PlaceCard place={place} />
          <Link
            href={`/${locale}/place/${place.id}`}
            className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t('place.details')}
            <span>→</span>
          </Link>
        </div>
      ))}
    </div>
  );
}

