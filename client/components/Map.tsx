'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Place } from '@/utils/types';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 25.0170,
  lng: 121.5395,
};

interface MapProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
  center: [number, number];
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number; name?: string } | null;
  basePoint?: { lat: number; lng: number; name?: string } | null;
  onMapLoad?: () => void;
  radius?: number;
  onLocationSelect?: (lat: number, lng: number, name?: string) => void;
}

export default function Map({ 
  places, 
  selectedPlace, 
  onPlaceSelect, 
  center,
  onMapClick,
  selectedLocation,
  basePoint,
  onMapLoad,
  radius,
  onLocationSelect
}: MapProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  // Map language based on locale: 'zh' -> 'zh-TW', 'en' -> 'en'
  const mapLanguage = locale === 'zh' ? 'zh-TW' : 'en';
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindowPlace, setInfoWindowPlace] = useState<Place | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const locationMarkerRef = useRef<google.maps.Marker | null>(null);
  const locationInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Debug: Log places when they change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Map received places:', places?.length || 0, places);
    }
  }, [places]);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY || '';

  // Keep onMapClick ref up to date
  useEffect(() => {
    console.log('🔄 onMapClick updated:', !!onMapClick);
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Debug: Log API key status (always log for debugging)
  useEffect(() => {
    console.log('🔍 Google Maps API Key Debug Info:', {
      hasKey: !!googleMapsApiKey,
      keyLength: googleMapsApiKey.length,
      keyPreview: googleMapsApiKey ? `${googleMapsApiKey.substring(0, 10)}...` : 'empty',
      keyStartsWith: googleMapsApiKey ? googleMapsApiKey.substring(0, 4) : 'N/A',
      isProduction: process.env.NODE_ENV === 'production',
      envVar: process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY ? 'exists' : 'missing',
    });
    
    // Warn if key seems invalid
    if (googleMapsApiKey && (googleMapsApiKey.length < 20 || !googleMapsApiKey.startsWith('AIza'))) {
      console.warn('⚠️ API Key format may be invalid. Google Maps API Keys usually start with "AIza" and are 39 characters long.');
    }
  }, [googleMapsApiKey]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsLoaded(true);

    // Remove existing click listener if any
    if (clickListenerRef.current) {
      window.google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    // Add click listener to map using ref to always get latest onMapClick
    // Always add listener, even if onMapClick is not provided initially
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      console.log('🗺️ Map click event triggered:', e);
      if (e.latLng && onMapClickRef.current) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        console.log('📍 Calling onMapClick with:', lat, lng);
        onMapClickRef.current(lat, lng);
      } else {
        console.warn('⚠️ Map click event but no latLng or onMapClick:', {
          hasLatLng: !!e.latLng,
          hasOnMapClick: !!onMapClickRef.current,
        });
      }
    });
    clickListenerRef.current = listener;
    console.log('✅ Map click listener added');

    // Notify parent that map is loaded
    if (onMapLoad) {
      onMapLoad();
    }
  }, [onMapLoad]);

  const onMapUnmount = useCallback(() => {
    // Clean up click listener
    if (clickListenerRef.current) {
      window.google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }
    // Clean up circle
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    mapRef.current = null;
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.setCenter({ lat: center[0], lng: center[1] });
      mapRef.current.setZoom(16);
    }
  }, [center, isLoaded]);

  // When selectedPlace changes, pan to that place and show info window
  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      return;
    }

    // If selectedPlace is null, close info window
    if (!selectedPlace) {
      setInfoWindowPlace(null);
      return;
    }

    // Pan to the selected place
    const placePosition = { lat: selectedPlace.lat, lng: selectedPlace.lng };
    mapRef.current.panTo(placePosition);
    
    // Set zoom level to show the place clearly
    mapRef.current.setZoom(17);
    
    // Show info window for the selected place
    setInfoWindowPlace(selectedPlace);
  }, [selectedPlace, isLoaded]);

  // Update location marker and circle when selectedLocation changes
  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      return;
    }

    // Always clean up existing circle first
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    if (!selectedLocation) {
      // Clean up if selectedLocation is removed
      if (locationMarkerRef.current) {
        locationMarkerRef.current.setMap(null);
        locationMarkerRef.current = null;
      }
      if (locationInfoWindowRef.current) {
        locationInfoWindowRef.current.close();
        locationInfoWindowRef.current = null;
      }
      setShowLocationInfo(false);
      return;
    }

    // Remove existing marker if any
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setMap(null);
    }
    if (locationInfoWindowRef.current) {
      locationInfoWindowRef.current.close();
    }

    // Create or update circle for search radius (only one circle should exist)
    if (radius && radius > 0) {
      const circle = new window.google.maps.Circle({
        center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        radius: radius,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        strokeColor: '#4285F4',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        map: mapRef.current,
        clickable: false, // Ensure circle doesn't block map clicks
      });
      circleRef.current = circle;
    }

    // Create new marker for selected location
    const marker = new window.google.maps.Marker({
      position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
      map: mapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#FF0000',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      title: selectedLocation.name || t('map.selectLocation'),
      zIndex: 1000,
      clickable: true,
    });

    // Add click listener to show info window
    marker.addListener('click', () => {
      if (locationInfoWindowRef.current) {
        locationInfoWindowRef.current.close();
      }
      
      const displayName = selectedLocation.name || `(${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)})`;
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 150px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #333;">
              ${displayName}
            </div>
            ${selectedLocation.name ? `
            <div style="font-size: 11px; color: #666; margin-top: 4px;">
              ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}
            </div>
            ` : ''}
          </div>
        `,
      });
      
      infoWindow.open(mapRef.current, marker);
      locationInfoWindowRef.current = infoWindow;
      setShowLocationInfo(true);
    });

    // Auto-open info window when location is selected
    const displayName = selectedLocation.name || `(${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)})`;
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; min-width: 150px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #333;">
            ${displayName}
          </div>
          ${selectedLocation.name ? `
          <div style="font-size: 11px; color: #666; margin-top: 4px;">
            ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}
          </div>
          ` : ''}
        </div>
      `,
    });
    
    infoWindow.open(mapRef.current, marker);
    locationInfoWindowRef.current = infoWindow;
    setShowLocationInfo(true);

    locationMarkerRef.current = marker;
  }, [selectedLocation, isLoaded, radius]);

  const getMarkerIcon = (place: Place, isSelected: boolean): google.maps.Symbol | undefined => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) {
      return undefined;
    }
    
    // Color coding based on price level
    const priceColors: { [key: number]: string } = {
      1: '#10b981', // Green for inexpensive ($)
      2: '#eab308', // Yellow for moderate ($$)
      3: '#f97316', // Orange for expensive ($$$)
      4: '#ef4444', // Red for very expensive ($$$$)
    };
    
    // Base color based on price level
    const baseColor = priceColors[place.price_level] || '#6b7280'; // Gray as fallback
    
    // Selected markers use darker shade or add border
    const fillColor = isSelected ? baseColor : baseColor;
    const strokeColor = isSelected ? '#1e40af' : '#ffffff'; // Blue border when selected
    const strokeWeight = isSelected ? 4 : 3; // Thicker border when selected
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 10, // Slightly larger for better visibility
      fillColor: fillColor,
      fillOpacity: 1,
      strokeColor: strokeColor,
      strokeWeight: strokeWeight,
    };
  };

  const handleMarkerClick = (place: Place) => {
    // Show info window and select place
    setInfoWindowPlace(place);
    onPlaceSelect(place);
  };

  const handleInfoWindowClose = () => {
    setInfoWindowPlace(null);
  };

  // Check API key validity
  const isApiKeyValid = googleMapsApiKey && 
                        googleMapsApiKey !== 'XXX' && 
                        googleMapsApiKey !== 'your_google_maps_api_key_here' &&
                        googleMapsApiKey.length >= 20 &&
                        googleMapsApiKey.startsWith('AIza');

  if (!isApiKeyValid) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4 max-w-md">
          <p className="text-red-600 font-semibold text-lg mb-2">Google Maps API Key 未設定或無效</p>
          <p className="text-sm text-gray-600 mt-2 mb-4">
            請在 Vercel 環境變數中設定 NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded text-left mb-4">
            <p className="font-semibold mb-2 text-gray-900">診斷資訊：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>API Key 存在: {googleMapsApiKey ? '是' : '否'}</li>
              <li>API Key 長度: {googleMapsApiKey?.length || 0} 字元</li>
              <li>API Key 預覽: {googleMapsApiKey ? `${googleMapsApiKey.substring(0, 10)}...` : '無'}</li>
              <li>格式正確: {googleMapsApiKey?.startsWith('AIza') ? '是' : '否'}</li>
            </ul>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-1 text-gray-900">設定步驟：</p>
            <ol className="list-decimal list-inside space-y-1 text-left">
              <li>前往 Vercel Dashboard → Settings → Environment Variables</li>
              <li>添加變數名：NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY</li>
              <li>填入您的 Google Maps API Key（應以 "AIza" 開頭）</li>
              <li>選擇所有環境（Production, Preview, Development）</li>
              <li>重新部署應用程式</li>
            </ol>
            <p className="mt-2 text-blue-600">
              💡 提示：訪問 <code>/api/debug</code> 查看環境變數狀態
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if LoadScript failed
  if (loadError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4 max-w-md">
          <p className="text-red-600 font-semibold text-lg mb-2">Google Maps 載入失敗</p>
          <p className="text-sm text-gray-600 mt-2 mb-4">{loadError}</p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-1 text-gray-900">可能的原因：</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>API Key 無效或未啟用 Maps JavaScript API</li>
              <li>API Key 限制設定不允許此網域</li>
              <li>API 配額已用完</li>
              <li>請檢查瀏覽器控制台（F12）以獲取詳細錯誤</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <LoadScript 
        key={mapLanguage} // Force reload when language changes
        googleMapsApiKey={googleMapsApiKey}
        libraries={['places']}
        language={mapLanguage}
        loadingElement={<div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Google Maps...</div>}
        onError={(error) => {
          console.error('❌ Google Maps LoadScript error:', error);
          console.error('Error details:', {
            message: error?.message,
            name: error?.name,
            stack: error?.stack,
            apiKey: googleMapsApiKey ? `${googleMapsApiKey.substring(0, 10)}...` : 'missing',
          });
          const errorMessage = error?.message || 'Unknown error';
          setLoadError(`無法載入 Google Maps: ${errorMessage}`);
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: center[0], lng: center[1] }}
          zoom={16}
          onLoad={handleMapLoad}
          onUnmount={onMapUnmount}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Search radius circle - managed via useEffect to ensure only one circle exists */}

          {places && Array.isArray(places) && places.length > 0 && places.map((place) => {
            if (!place || !place.lat || !place.lng) {
              console.warn('Invalid place data:', place);
              return null;
            }
            const isSelected = selectedPlace?.id === place.id;
            return (
              <Marker
                key={place.id || `${place.lat}-${place.lng}`}
                position={{ lat: place.lat, lng: place.lng }}
                icon={isLoaded ? getMarkerIcon(place, isSelected) : undefined}
                onClick={(e) => {
                  // Stop event propagation to prevent map click
                  if (e.domEvent) {
                    e.domEvent.stopPropagation();
                  }
                  handleMarkerClick(place);
                }}
                label={{
                  text: '$'.repeat(place.price_level || 1) || '?',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              />
            );
          })}

          {infoWindowPlace && (
            <InfoWindow
              position={{ lat: infoWindowPlace.lat, lng: infoWindowPlace.lng }}
              onCloseClick={handleInfoWindowClose}
            >
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-sm mb-1 text-gray-900">{infoWindowPlace.name_zh}</h3>
                <p className="text-xs text-gray-600 mb-2">{infoWindowPlace.name_en}</p>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-gray-900">⭐ {infoWindowPlace.rating.toFixed(1)}</span>
                    <span className="ml-2 text-gray-900">{'$'.repeat(infoWindowPlace.price_level)}</span>
                  </div>
                  {infoWindowPlace.distance_m && (
                    <div className="text-gray-700">
                      {(infoWindowPlace.distance_m / 1000).toFixed(2)} km
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (infoWindowPlace.id) {
                          router.push(`/${locale}/place/${infoWindowPlace.id}`);
                        }
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      {t('map.viewDetails')}
                    </button>
                    {onLocationSelect && (
                      <button
                        onClick={() => {
                          onLocationSelect(infoWindowPlace.lat, infoWindowPlace.lng, infoWindowPlace.name_zh || infoWindowPlace.name_en);
                          handleInfoWindowClose();
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                      >
                        {t('map.viewNearby')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

