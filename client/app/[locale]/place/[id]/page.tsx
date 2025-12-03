'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchPlace } from '@/utils/api';
import { Place } from '@/utils/types';
import ScoreBreakdown from '@/components/ScoreBreakdown';

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadPlace(params.id as string);
    }
  }, [params.id]);

  const loadPlace = async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchPlace(id);
      setPlace(data);
    } catch (error) {
      console.error('Failed to load place:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">{t('common.error')}</div>
      </div>
    );
  }

  const locale = useParams().locale as string;
  const name = locale === 'zh' ? place.name_zh : place.name_en;
  const address = locale === 'zh' ? place.address_zh : place.address_en;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 text-primary-600 hover:text-primary-700"
      >
        ← {t('common.back')}
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{name}</h1>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-gray-600">{t('place.rating')}: </span>
              <span className="font-semibold">{place.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm"> ({place.rating_count})</span>
            </div>
            <div>
              <span className="text-gray-600">{t('place.price')}: </span>
              <span className="font-semibold">{'$'.repeat(place.price_level)}</span>
            </div>
            {place.distance_m && (
              <div>
                <span className="text-gray-600">{t('place.distance')}: </span>
                <span className="font-semibold">{(place.distance_m / 1000).toFixed(2)} km</span>
              </div>
            )}
            {place.score && (
              <div>
                <span className="text-gray-600">{t('place.recommendationScore')}: </span>
                <span className="font-semibold">{place.score.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('place.address')}</h2>
            <p className="text-gray-700">{address}</p>
            {place.phone && (
              <p className="text-gray-700 mt-2">
                <span className="font-semibold">{t('place.phone')}: </span>
                {place.phone}
              </p>
            )}
          </div>

          {place.categories.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{t('place.categories')}</h2>
              <div className="flex flex-wrap gap-2">
                {place.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {place.features.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{t('place.features')}</h2>
              <div className="flex flex-wrap gap-2">
                {place.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {place.score_breakdown && (
            <div className="mb-6">
              <ScoreBreakdown breakdown={place.score_breakdown} />
            </div>
          )}

          {place.open_hours && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{t('place.hours')}</h2>
              <div className="space-y-1">
                {Object.entries(place.open_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="font-medium">{day}:</span>
                    <span>{hours.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

