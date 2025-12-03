'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { spinRoulette } from '@/utils/api';
import { Place, RouletteRequest } from '@/utils/types';
import Link from 'next/link';

export default function RoulettePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSpin = async () => {
    setSpinning(true);
    setError(null);
    setResult(null);

    try {
      // Use NTU center coordinates
      const request: RouletteRequest = {
        lat: 25.0170,
        lng: 121.5395,
        filters: {
          radius: 2000,
          rating_min: 3.5,
        },
      };

      const place = await spinRoulette(request);
      
      // Simulate spinning animation delay
      setTimeout(() => {
        setResult(place);
        setSpinning(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to spin');
      setSpinning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t('roulette.title')}</h1>
        <p className="text-gray-600 mb-8">{t('roulette.subtitle')}</p>

        <div className="mb-8">
          <div className="relative w-64 h-64 mx-auto">
            <div
              className={`w-full h-full rounded-full border-8 border-primary-600 flex items-center justify-center transition-transform duration-2000 ${
                spinning ? 'animate-spin' : ''
              }`}
              style={{
                background: 'conic-gradient(from 0deg, #0ea5e9, #38bdf8, #0ea5e9)',
              }}
            >
              <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center">
                {spinning ? (
                  <div className="text-primary-600 font-bold text-xl">
                    {t('common.loading')}
                  </div>
                ) : result ? (
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-primary-600">🎉</div>
                    <div className="text-sm text-gray-600 mt-2">{t('roulette.result')}</div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="text-4xl">🍽️</div>
                    <div className="text-sm text-gray-600 mt-2">Ready</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={spinning}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {spinning ? t('common.loading') : t('roulette.spin')}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">{t('roulette.selectedPlace')}</h2>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-2">
                {locale === 'zh' ? result.name_zh : result.name_en}
              </h3>
              <div className="space-y-2 text-gray-700">
                <div>
                  <span className="font-medium">{t('place.rating')}: </span>
                  {result.rating.toFixed(1)} ({result.rating_count})
                </div>
                <div>
                  <span className="font-medium">{t('place.price')}: </span>
                  {'$'.repeat(result.price_level)}
                </div>
                {result.distance_m && (
                  <div>
                    <span className="font-medium">{t('place.distance')}: </span>
                    {(result.distance_m / 1000).toFixed(2)} km
                  </div>
                )}
                {result.categories.length > 0 && (
                  <div>
                    <span className="font-medium">{t('place.categories')}: </span>
                    {result.categories.join(', ')}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href={`/${locale}/place/${result.id}`}
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  {t('place.details')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

