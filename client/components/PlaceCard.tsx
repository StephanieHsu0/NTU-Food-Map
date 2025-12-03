'use client';

import { useLocale } from 'next-intl';
import { Place } from '@/utils/types';

interface PlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const locale = useLocale();
  const name = locale === 'zh' ? place.name_zh : place.name_en;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-1">{name}</h3>
      {locale === 'zh' && place.name_en && (
        <p className="text-sm text-gray-600 mb-2">{place.name_en}</p>
      )}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span className="flex items-center">
          ⭐ {place.rating.toFixed(1)}
          <span className="text-gray-400 ml-1">({place.rating_count})</span>
        </span>
        <span>{'$'.repeat(place.price_level)}</span>
        {place.distance_m && (
          <span>{(place.distance_m / 1000).toFixed(2)} km</span>
        )}
        {place.score && (
          <span className="text-primary-600 font-semibold">
            Score: {place.score.toFixed(1)}
          </span>
        )}
      </div>
      {place.categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {place.categories.slice(0, 3).map((cat, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

