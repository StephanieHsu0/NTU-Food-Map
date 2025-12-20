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
    <div className="transition-colors">
      <h3 className="font-semibold text-lg mb-1.5 text-text-primary leading-tight">{name}</h3>
      {locale === 'zh' && place.name_en && (
        <p className="text-sm text-text-secondary mb-3">{place.name_en}</p>
      )}
      <div className="flex items-center flex-wrap gap-3 text-sm mb-3">
        <span className="flex items-center text-text-primary">
          <span className="text-yellow-500 mr-1">⭐</span>
          <span className="font-medium">{place.rating.toFixed(1)}</span>
          <span className="text-text-secondary ml-1">({place.rating_count})</span>
        </span>
        <span className="text-text-primary font-medium">{'$'.repeat(place.price_level)}</span>
        {place.distance_m && (
          <span className="text-text-secondary">{(place.distance_m / 1000).toFixed(2)} km</span>
        )}
        {place.score && (
          <span className="text-primary-600 font-semibold">
            Score: {place.score.toFixed(1)}
          </span>
        )}
      </div>
      {place.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {place.categories.slice(0, 3).map((cat, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-gray-50 text-text-secondary rounded-full text-xs border border-divider"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

