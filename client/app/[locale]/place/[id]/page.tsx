'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { LoadScript } from '@react-google-maps/api';
import { fetchPlace } from '@/utils/api';
import { getPlaceDetails } from '@/utils/googlePlaces';
import { Place } from '@/utils/types';
import ScoreBreakdown from '@/components/ScoreBreakdown';

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = params.locale as string;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY || '';

  // Check if this is a Google Places ID
  // Google Places IDs typically start with ChIJ or ChlJ and are 27 characters long
  const isGooglePlacesId = params.id && (
    (params.id as string).startsWith('ChIJ') || 
    (params.id as string).startsWith('ChlJ') ||
    (params.id as string).length > 20
  );

  // Static libraries array to avoid LoadScript reload warning
  const libraries: ('places')[] = ['places'];

  useEffect(() => {
    if (params.id) {
      // If it's a Google Places ID, wait for maps to load
      if (isGooglePlacesId && !mapsLoaded) {
        return; // Wait for maps to load
      }
      loadPlace(params.id as string);
    }
  }, [params.id, mapsLoaded, isGooglePlacesId]);

  const loadPlace = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (isGooglePlacesId) {
        // Wait for Google Maps API with retries
        let retries = 0;
        const maxRetries = 10;
        while (typeof window === 'undefined' || !window.google?.maps?.places) {
          if (retries >= maxRetries) {
            throw new Error(t('common.googleMapsTimeout'));
          }
          await new Promise(resolve => setTimeout(resolve, 300));
          retries++;
        }
        
        // Use Google Places API for Google Places IDs
        // Default location: NTU center
        const defaultLat = 25.0170;
        const defaultLng = 121.5395;
        const data = await getPlaceDetails(id, defaultLat, defaultLng);
        console.log('Loaded place data:', data);
        setPlace(data);
      } else {
        // Use database API for regular IDs
        const data = await fetchPlace(id);
        setPlace(data);
      }
    } catch (error) {
      console.error('Failed to load place:', error);
      setPlace(null);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load place';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-gray-900">{t('common.loading')}</div>
        </div>
      );
    }

    if (!place && !loading) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-primary-600 hover:text-primary-700"
          >
            ← {t('common.back')}
          </button>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-600 font-semibold text-lg mb-2">
              {t('common.error')}
            </div>
            {error && (
              <div className="text-sm text-gray-600 mb-4">{error}</div>
            )}
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-primary-600 hover:text-primary-700"
        >
          ← {t('common.back')}
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">{name}</h1>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-600">{t('place.rating')}: </span>
                {place.rating && place.rating > 0 ? (
                  <span className="font-semibold text-gray-900">{place.rating.toFixed(1)}</span>
                ) : (
                  <span className="text-gray-400">{t('place.notProvided')}</span>
                )}
                {place.rating_count > 0 && (
                  <span className="text-gray-500 text-sm"> ({place.rating_count})</span>
                )}
              </div>
              <div>
                <span className="text-gray-600">{t('place.price')}: </span>
                {place.price_level && place.price_level > 0 ? (
                  <span className="font-semibold text-gray-900">{'$'.repeat(place.price_level)}</span>
                ) : (
                  <span className="text-gray-400">{t('place.notProvided')}</span>
                )}
              </div>
              <div>
                <span className="text-gray-600">{t('place.distance')}: </span>
                {place.distance_m !== undefined && place.distance_m > 0 ? (
                  <span className="font-semibold text-gray-900">{(place.distance_m / 1000).toFixed(2)} km</span>
                ) : (
                  <span className="text-gray-400">{t('place.notProvided')}</span>
                )}
              </div>
              {place.score && (
                <div>
                  <span className="text-gray-600">{t('place.recommendationScore')}: </span>
                  <span className="font-semibold text-gray-900">{place.score.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">{t('place.address')}</h2>
              <p className="text-gray-700">{address}</p>
              {place.phone && (
                <p className="text-gray-700 mt-2">
                  <span className="font-semibold text-gray-900">{t('place.phone')}: </span>
                  <span className="text-gray-700">{place.phone}</span>
                </p>
              )}
            </div>

            {place.categories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{t('place.categories')}</h2>
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
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{t('place.features')}</h2>
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
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{t('place.hours')}</h2>
                <div className="space-y-1">
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
                        <span className="font-medium text-gray-900">{translatedDay}:</span>
                        <span className="text-gray-700">{hours.join(', ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {place.photos && place.photos.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{t('place.photos')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {place.photos.slice(0, 6).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`${name} - Photo ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {place.website && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{t('place.website')}</h2>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  {place.website}
                </a>
              </div>
            )}

            {place.reviews && place.reviews.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{t('place.reviews')}</h2>
                <div className="space-y-4">
                  {place.reviews.map((review, idx) => (
                    <div key={idx} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3 mb-2">
                        {review.profile_photo_url && (
                          <img
                            src={review.profile_photo_url}
                            alt={review.author_name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {review.author_url ? (
                              <a
                                href={review.author_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-gray-900 hover:text-primary-600"
                              >
                                {review.author_name}
                              </a>
                            ) : (
                              <span className="font-semibold text-gray-900">{review.author_name}</span>
                            )}
                            <span className="text-yellow-500">⭐ {review.rating}</span>
                            <span className="text-gray-500 text-sm">{review.relative_time_description}</span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {t('place.reviewsSource')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // If it's a Google Places ID, wrap with LoadScript
  if (isGooglePlacesId && googleMapsApiKey) {
    return (
      <LoadScript
        googleMapsApiKey={googleMapsApiKey}
        libraries={libraries}
        onLoad={() => {
          setMapsLoaded(true);
        }}
        onError={(error) => {
          console.error('Failed to load Google Maps:', error);
          setError(t('common.googleMapsLoadError'));
          setLoading(false);
        }}
      >
        {renderContent()}
      </LoadScript>
    );
  }

  return renderContent();
}

