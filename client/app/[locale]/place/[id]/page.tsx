'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';
import { fetchPlace, savePlace } from '@/utils/api';
import { getPlaceDetails } from '@/utils/googlePlaces';
import { Place } from '@/utils/types';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import CommentSection from '@/components/CommentSection';
import FavoriteButton from '@/components/FavoriteButton';

// 模組級別的變數，確保語言配置只設置一次，即使組件重新掛載也不會改變
let globalMapLanguage: string | null = null;

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = params.locale as string;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY || '';

  // Check if this is a Google Places ID
  // Google Places IDs typically start with ChIJ or ChlJ and are 27 characters long
  const isGooglePlacesId = useMemo(() => {
    if (!params.id) return false;
    const idStr = params.id as string;
    return idStr.startsWith('ChIJ') || idStr.startsWith('ChlJ') || idStr.length > 20;
  }, [params.id]);

  // Static libraries array to avoid reload warning
  const libraries = useMemo<("places")[]>(() => ['places'], []);
  
  // Map language based on locale: 'zh' -> 'zh-TW', 'en' -> 'en'
  // 使用模組級別的變數確保語言配置只設置一次，避免語言切換時重新加載腳本
  const mapLanguage = locale === 'zh' ? 'zh-TW' : 'en';
  if (globalMapLanguage === null) {
    globalMapLanguage = mapLanguage;
  }
  const stableLanguage = globalMapLanguage;
  
  const loaderConfig = useMemo(() => ({
    id: 'google-map-script',
    googleMapsApiKey,
    libraries,
    language: stableLanguage, // 使用穩定的語言，與 Map.tsx 保持一致
  }), [googleMapsApiKey, libraries, stableLanguage]);

  const { isLoaded: scriptLoaded, loadError: scriptError } = useJsApiLoader(loaderConfig);

  useEffect(() => {
    if (!params.id) return;

    let isMounted = true;
    const isMountedRef = () => isMounted;
    const apiLoaded = typeof window !== 'undefined' && !!window.google?.maps?.places;

    // If it's a Google Places ID, wait for maps to load
    if (isGooglePlacesId && !mapsLoaded && !apiLoaded) {
      return () => {
        isMounted = false;
      };
    }

    // If API is already loaded, mark as loaded to unblock data fetching
    if (isGooglePlacesId && apiLoaded && !mapsLoaded) {
      setMapsLoaded(true);
    }

    // Small delay to ensure component is fully mounted before loading
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        loadPlace(params.id as string, isMountedRef);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [params.id, mapsLoaded, isGooglePlacesId]);

  // Mark maps loaded when script is ready
  useEffect(() => {
    if (scriptLoaded && !mapsLoaded) {
      setMapsLoaded(true);
    }
  }, [scriptLoaded, mapsLoaded]);

  // Handle script load error
  useEffect(() => {
    if (scriptError) {
      setError(t('common.googleMapsLoadError'));
      setLoading(false);
    }
  }, [scriptError, t]);

  const loadPlace = async (id: string, isMountedRef: () => boolean) => {
    setLoading(true);
    setError(null);
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Set a hard timeout to avoid infinite loading (e.g., Maps API not loaded)
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef()) {
        setLoading(false);
        setError(t('common.googleMapsLoadError'));
      }
    }, 10000);

    const waitForPlacesApi = async () => {
      let retries = 0;
      const maxRetries = 10;
      while (typeof window === 'undefined' || !window.google?.maps?.places) {
        if (retries >= maxRetries) {
          throw new Error(t('common.googleMapsTimeout'));
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        retries++;
      }
    };

    try {
      if (isGooglePlacesId) {
        // Ensure Google Places API is ready
        await waitForPlacesApi();

        // Use Google Places API for Google Places IDs
        // Default location: NTU center
        const defaultLat = 25.0170;
        const defaultLng = 121.5395;
        const data = await getPlaceDetails(id, defaultLat, defaultLng);
        if (!isMountedRef()) return;
        setPlace(data);
        // Persist to database so other pages (e.g., profile) can resolve names
        savePlace(data).catch((err) => console.warn('Failed to save place', err));
      } else {
        // Use database API for regular IDs
        const data = await fetchPlace(id);
        if (!isMountedRef()) return;
        setPlace(data);
        // Ensure we have the latest snapshot stored
        savePlace(data).catch((err) => console.warn('Failed to save place', err));
      }
    } catch (error) {
      console.error('Failed to load place:', error);
      if (!isMountedRef()) return;
      setPlace(null);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load place';
      setError(errorMessage);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isMountedRef()) {
        setLoading(false);
      }
    }
  };

  // Render content
  const renderContent = () => {
    if (error && !loading) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            ← {t('common.back')}
          </button>
          <div className="bg-white rounded-xl shadow-md border border-divider p-6 text-center">
            <div className="text-red-600 font-semibold text-lg mb-2">
              {t('common.error')}
            </div>
            {error && (
              <div className="text-sm text-text-secondary mb-4">{error}</div>
            )}
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={() => {
                  if (params.id) {
                    loadPlace(params.id as string, () => true);
                  }
                }}
                className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm"
              >
                {t('common.retry')}
              </button>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2.5 bg-white text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 transition-all font-medium shadow-sm"
            >
              {t('place.backToMap')}
            </button>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-primary-600 opacity-20 animate-pulse" />
              </div>
            </div>
            <div className="text-sm font-medium text-text-primary">{t('common.loading')}</div>
            <div className="text-xs text-text-secondary">載入餐廳資訊中...</div>
          </div>
        </div>
      );
    }

    if (!place && !loading) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            ← {t('common.back')}
          </button>
          <div className="bg-white rounded-xl shadow-md border border-divider p-6 text-center">
            <div className="text-red-600 font-semibold text-lg mb-2">
              {t('common.error')}
            </div>
            {error && (
              <div className="text-sm text-text-secondary mb-4">{error}</div>
            )}
            <button
              onClick={() => router.back()}
              className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm"
            >
              {t('place.backToMap')}
            </button>
          </div>
        </div>
      );
    }

    if (!place) return null;

    // Get name with fallback
    const name = (locale === 'zh' ? place.name_zh : place.name_en) || place.name_zh || place.name_en || t('place.unknownPlace');
    // Get address with fallback
    const address = (locale === 'zh' ? place.address_zh : place.address_en) || place.address_zh || place.address_en || '';
    
    // Debug: log place data with type checking
    if (process.env.NODE_ENV === 'development') {
      console.log('Rendering place - Full data:', place);
      console.log('Rendering place - Direct checks:', {
        'place.rating': place.rating,
        'place.rating ? true : false': place.rating ? true : false,
        'place.price_level': place.price_level,
        'place.price_level > 0': place.price_level > 0,
        'place.distance_m': place.distance_m,
        'place.distance_m > 0': place.distance_m !== undefined ? place.distance_m > 0 : false,
      });
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 bg-background min-h-screen">
        <button
          onClick={() => router.back()}
          className="mb-6 text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          ← {t('common.back')}
        </button>

        <div className="bg-white rounded-xl shadow-md border border-divider overflow-hidden">
          <div className="p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-text-primary">{name}</h1>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-text-secondary">{t('place.rating')}: </span>
                {place.rating && place.rating > 0 ? (
                  <span className="font-semibold text-text-primary">{place.rating.toFixed(1)}</span>
                ) : (
                  <span className="text-text-secondary">{t('place.notProvided')}</span>
                )}
                {place.rating_count > 0 && (
                  <span className="text-text-secondary text-sm"> ({place.rating_count})</span>
                )}
              </div>
              <div>
                <span className="text-text-secondary">{t('place.price')}: </span>
                {place.price_level && place.price_level > 0 ? (
                  <span className="font-semibold text-text-primary">{'$'.repeat(place.price_level)}</span>
                ) : (
                  <span className="text-text-secondary">{t('place.notProvided')}</span>
                )}
              </div>
              <div>
                <span className="text-text-secondary">{t('place.distance')}: </span>
                {place.distance_m !== undefined && place.distance_m > 0 ? (
                  <span className="font-semibold text-text-primary">{(place.distance_m / 1000).toFixed(2)} km</span>
                ) : (
                  <span className="text-text-secondary">{t('place.notProvided')}</span>
                )}
              </div>
              {place.score && (
                <div>
                  <span className="text-text-secondary">{t('place.recommendationScore')}: </span>
                  <span className="font-semibold text-primary-600">{place.score.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mb-6 pb-6 border-b border-divider">
              <h2 className="text-xl font-semibold mb-2 text-text-primary">{t('place.address')}</h2>
              <p className="text-text-secondary">{address}</p>
              {place.phone && (
                <p className="text-text-secondary mt-2">
                  <span className="font-semibold text-text-primary">{t('place.phone')}: </span>
                  <span className="text-text-secondary">{place.phone}</span>
                </p>
              )}
            </div>

            {place.categories.length > 0 && (
              <div className="mb-6 pb-6 border-b border-divider">
                <h2 className="text-xl font-semibold mb-3 text-text-primary">{t('place.categories')}</h2>
                <div className="flex flex-wrap gap-2">
                  {place.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-sm font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {place.features.length > 0 && (
              <div className="mb-6 pb-6 border-b border-divider">
                <h2 className="text-xl font-semibold mb-3 text-text-primary">{t('place.features')}</h2>
                <div className="flex flex-wrap gap-2">
                  {place.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium"
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
              <div className="mb-6 pb-6 border-b border-divider">
                <h2 className="text-xl font-semibold mb-3 text-text-primary">{t('place.hours')}</h2>
                <div className="space-y-2">
                  {Object.entries(place.open_hours).map(([day, hours]) => {
                    // Translate day names from Chinese to English if needed
                    const dayTranslations: { [key: string]: { zh: string; en: string } } = {
                      '星期一': { zh: '星期一', en: 'Monday' },
                      '星期二': { zh: '星期二', en: 'Tuesday' },
                      '星期三': { zh: '星期三', en: 'Wednesday' },
                      '星期四': { zh: '星期四', en: 'Thursday' },
                      '星期五': { zh: '星期五', en: 'Friday' },
                      '星期六': { zh: '星期六', en: 'Saturday' },
                      '星期日': { zh: '星期日', en: 'Sunday' },
                      'Monday': { zh: '星期一', en: 'Monday' },
                      'Tuesday': { zh: '星期二', en: 'Tuesday' },
                      'Wednesday': { zh: '星期三', en: 'Wednesday' },
                      'Thursday': { zh: '星期四', en: 'Thursday' },
                      'Friday': { zh: '星期五', en: 'Friday' },
                      'Saturday': { zh: '星期六', en: 'Saturday' },
                      'Sunday': { zh: '星期日', en: 'Sunday' },
                    };
                    const translatedDay = dayTranslations[day] 
                      ? (locale === 'zh' ? dayTranslations[day].zh : dayTranslations[day].en)
                      : day;
                    return (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium text-text-primary">{translatedDay}:</span>
                        <span className="text-text-secondary">{hours.join(', ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {place.photos && place.photos.length > 0 && (
              <div className="mb-6 pb-6 border-b border-divider">
                <h2 className="text-xl font-semibold mb-3 text-text-primary">{t('place.photos')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {place.photos.slice(0, 6).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`${name} - Photo ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-xl shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {place.website && (
              <div className="mb-6 pb-6 border-b border-divider">
                <h2 className="text-xl font-semibold mb-2 text-text-primary">{t('place.website')}</h2>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline font-medium transition-colors"
                >
                  {place.website}
                </a>
              </div>
            )}

            {place.reviews && place.reviews.length > 0 && (
              <div className="mb-6 pb-6 border-b border-divider">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">{t('place.reviews')}</h2>
                <div className="space-y-4">
                  {place.reviews.map((review, idx) => (
                    <div key={idx} className="border-b border-divider pb-4 last:border-b-0">
                      <div className="flex items-start gap-3 mb-2">
                        {review.profile_photo_url && (
                          <img
                            src={review.profile_photo_url}
                            alt={review.author_name}
                            className="w-10 h-10 rounded-full border border-divider"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {review.author_url ? (
                              <a
                                href={review.author_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-text-primary hover:text-primary-600 transition-colors"
                              >
                                {review.author_name}
                              </a>
                            ) : (
                              <span className="font-semibold text-text-primary">{review.author_name}</span>
                            )}
                            <span className="text-yellow-500">⭐ {review.rating}</span>
                            <span className="text-text-secondary text-sm">{review.relative_time_description}</span>
                          </div>
                          <p className="text-text-primary text-sm leading-relaxed">{review.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-3">
                  {t('place.reviewsSource')}
                </p>
              </div>
            )}

            {/* Favorite Button */}
            {place.id && <FavoriteButton placeId={place.id} />}

            {/* Comments Section */}
            {place.id && <CommentSection placeId={place.id} />}
          </div>
        </div>
      </div>
    );
  };

  // If script is not loaded yet for Google Places ID, show loading
  if (isGooglePlacesId && !scriptLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
          <div className="text-sm text-text-secondary">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return renderContent();
}

