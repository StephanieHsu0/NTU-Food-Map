'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Place, FilterParams } from '@/utils/types';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterParams;
  filteredPlaces: Place[];
  onPlaceSelect: (place: Place) => void;
}

export default function RouletteModal({ isOpen, onClose, filters, filteredPlaces, onPlaceSelect }: RouletteModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableCount, setAvailableCount] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Update available count when filtered places change
  useEffect(() => {
    if (isOpen) {
      setAvailableCount(filteredPlaces.length);
    }
  }, [filteredPlaces, isOpen]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setError(null);
      setSpinning(false);
    }
  }, [isOpen]);

  const handleSpin = async () => {
    if (availableCount === 0 || filteredPlaces.length === 0) {
      setError(t('roulette.noPlacesAvailable'));
      return;
    }

    setSpinning(true);
    setError(null);
    setResult(null);

    try {
      // Randomly select from filtered places
      const randomIndex = Math.floor(Math.random() * filteredPlaces.length);
      const selectedPlace = filteredPlaces[randomIndex];
      
      // Simulate spinning animation delay
      setTimeout(() => {
        setResult(selectedPlace);
        setSpinning(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('roulette.spinError'));
      setSpinning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal panel */}
        <div
          className="inline-block w-full max-w-3xl text-left align-middle transition-all transform bg-white shadow-xl rounded-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-primary-600 text-white">
            <h2 className="text-2xl font-bold">{t('roulette.title')}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="flex flex-col items-center justify-start p-6 lg:p-8 overflow-y-auto bg-white max-h-[80vh]"
          >
            <div className="max-w-2xl w-full text-center">
              <p className="text-gray-600 mb-6 lg:mb-8 text-sm lg:text-base">{t('roulette.subtitle')}</p>

              {/* Available places count */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  {t('roulette.availablePlaces')}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {availableCount} {t('roulette.places')}
                </div>
              </div>

              {availableCount === 0 && (
                <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                  {t('roulette.noPlacesAvailable')}
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Roulette Wheel */}
              <div className="mb-6 lg:mb-8">
                <div className="relative w-48 h-48 lg:w-64 lg:h-64 mx-auto">
                  <div
                    className={`w-full h-full rounded-full border-8 border-primary-600 flex items-center justify-center transition-transform duration-2000 ${
                      spinning ? 'animate-spin' : ''
                    }`}
                    style={{
                      background: 'conic-gradient(from 0deg, #0ea5e9, #38bdf8, #0ea5e9)',
                    }}
                  >
                    <div className="w-36 h-36 lg:w-48 lg:h-48 bg-white rounded-full flex items-center justify-center shadow-inner">
                      {spinning ? (
                        <div className="text-primary-600 font-bold text-lg lg:text-xl">
                          {t('common.loading')}
                        </div>
                      ) : result ? (
                        <div className="text-center p-2 lg:p-4">
                          <div className="text-xl lg:text-2xl font-bold text-primary-600">🎉</div>
                          <div className="text-xs lg:text-sm text-gray-600 mt-1 lg:mt-2">{t('roulette.result')}</div>
                        </div>
                      ) : (
                        <div className="text-center p-2 lg:p-4">
                          <div className="text-3xl lg:text-4xl">🍽️</div>
                          <div className="text-xs lg:text-sm text-gray-600 mt-1 lg:mt-2">{t('roulette.ready')}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Spin Button */}
              <div className="mb-6">
                <button
                  onClick={handleSpin}
                  disabled={spinning || availableCount === 0}
                  className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-w-[200px]"
                  type="button"
                >
                  {spinning ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('common.loading')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">🎰</span>
                      {t('roulette.spin')}
                    </span>
                  )}
                </button>
              </div>

              {/* Result Display */}
              {result && (
                <div className="mt-8 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-100 p-6">
                  {(() => {
                    const primaryName = locale === 'zh' ? result.name_zh : result.name_en;
                    const secondaryName = locale === 'zh' ? result.name_en : result.name_zh;
                    const displayName = primaryName || secondaryName || t('place.unknownPlace');

                    return (
                      <div className="flex items-start justify-between gap-4 border-b pb-4">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xl">
                            🎉
                          </div>
                          <div className="text-left">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                              {t('roulette.selectedPlace')}
                            </p>
                            <h3 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h3>
                            {secondaryName && (
                              <p className="text-sm text-gray-500 mt-1">{secondaryName}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={handleSpin}
                          disabled={spinning || availableCount === 0}
                          className="px-3 py-2 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          type="button"
                        >
                          {t('roulette.tryAgain')}
                        </button>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">{t('place.rating')}:</span>
                      <span className="ml-1 font-bold">{result.rating.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({result.rating_count})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-green-600">$</span>
                      <span className="font-semibold">{t('place.price')}:</span>
                      <span className="ml-1">{'$'.repeat(result.price_level)}</span>
                    </div>

                    {result.distance_m && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">📍</span>
                        <span className="font-semibold">{t('place.distance')}:</span>
                        <span className="ml-1">{(result.distance_m / 1000).toFixed(2)} km</span>
                      </div>
                    )}

                    {result.categories.length > 0 && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <span className="text-purple-600">🏷️</span>
                        <span className="font-semibold">{t('place.categories')}:</span>
                        <span className="ml-1 text-gray-700">{result.categories.join(' / ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      onClick={() => {
                        if (result) {
                          onPlaceSelect(result);
                          onClose();
                        }
                      }}
                      className="px-5 py-2.5 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition"
                      type="button"
                    >
                      {t('place.details')}
                    </button>
                    <button
                      onClick={handleSpin}
                      disabled={spinning || availableCount === 0}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      type="button"
                    >
                      {t('roulette.tryAgain')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

