'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, Circle, useJsApiLoader } from '@react-google-maps/api';
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
  // Keep loader options stable to avoid double-loading errors; do not vary language/region here.
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindowPlace, setInfoWindowPlace] = useState<Place | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const locationMarkerRef = useRef<google.maps.Marker | null>(null);
  const locationInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const basePointMarkerRef = useRef<google.maps.Marker | null>(null);
  const basePointInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const isAutoAdjustingRef = useRef(false);

  // Debug: Log places when they change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Map received places:', places?.length || 0, places);
    }
  }, [places]);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY || '';
  const libraries = useMemo<("places")[]>(() => ['places'], []);

  const { isLoaded: scriptLoaded, loadError: scriptError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey,
    libraries,
  });

  // Keep onMapClick ref up to date
  useEffect(() => {
    console.log('🔄 onMapClick updated:', !!onMapClick);
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Avoid logging or exposing API keys in production.

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
    // Clean up basePoint marker
    if (basePointMarkerRef.current) {
      basePointMarkerRef.current.setMap(null);
      basePointMarkerRef.current = null;
    }
    if (basePointInfoWindowRef.current) {
      basePointInfoWindowRef.current.close();
      basePointInfoWindowRef.current = null;
    }
    mapRef.current = null;
  }, []);

  // Update map center when center prop changes (but don't auto-adjust if we have basePoint)
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      // Only auto-center if we don't have a basePoint (to avoid conflicts with radius-based auto-adjust)
      if (!basePoint) {
      mapRef.current.setCenter({ lat: center[0], lng: center[1] });
      mapRef.current.setZoom(16);
    }
    }
  }, [center, isLoaded, basePoint]);

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

    // Pan to the selected place (and basePoint if available)
    const placePosition = { lat: selectedPlace.lat, lng: selectedPlace.lng };

    if (basePoint) {
      // When both basePoint and selectedPlace are present, always fit bounds to show both
      // Temporarily disable auto-adjust flag to avoid skipping view updates
      isAutoAdjustingRef.current = false;
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(placePosition);
      bounds.extend({ lat: basePoint.lat, lng: basePoint.lng });

      const padding = { top: 140, bottom: 140, left: 140, right: 140 };
      const fitBoth = () => {
        if (!mapRef.current) return;
        mapRef.current.fitBounds(bounds, padding);
      };

      // Fit immediately and re-fit shortly after to avoid race with other updates
      fitBoth();
      setTimeout(fitBoth, 80);
    } else {
      // Only adjust zoom when not auto-adjusting radius
      if (!isAutoAdjustingRef.current) {
        mapRef.current.panTo(placePosition);
        mapRef.current.setZoom(17);
      }
    }
    
    // Show info window for the selected place
    setInfoWindowPlace(selectedPlace);
  }, [selectedPlace, isLoaded, basePoint]);

  // Update basePoint marker when basePoint changes
  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      return;
    }

    // Clean up existing basePoint marker if any
    if (basePointMarkerRef.current) {
      basePointMarkerRef.current.setMap(null);
      basePointMarkerRef.current = null;
    }
    if (basePointInfoWindowRef.current) {
      basePointInfoWindowRef.current.close();
      basePointInfoWindowRef.current = null;
    }

    if (!basePoint) {
      return;
    }

    // Create marker for basePoint
    const marker = new window.google.maps.Marker({
      position: { lat: basePoint.lat, lng: basePoint.lng },
      map: mapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#10B981', // Green color for base point
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      title: basePoint.name || t('map.basePoint'),
      zIndex: 1001, // Higher than location marker
      clickable: true,
    });

    // Add click listener to show info window
    marker.addListener('click', () => {
      if (basePointInfoWindowRef.current) {
        basePointInfoWindowRef.current.close();
      }
      
      const displayName = basePoint.name || `(${basePoint.lat.toFixed(4)}, ${basePoint.lng.toFixed(4)})`;
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 150px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #333;">
              ${t('map.basePoint')}: ${displayName}
            </div>
            ${basePoint.name ? `
            <div style="font-size: 11px; color: #666; margin-top: 4px;">
              ${basePoint.lat.toFixed(4)}, ${basePoint.lng.toFixed(4)}
            </div>
            ` : ''}
          </div>
        `,
      });
      
      infoWindow.open(mapRef.current, marker);
      basePointInfoWindowRef.current = infoWindow;
    });

    basePointMarkerRef.current = marker;
  }, [basePoint, isLoaded, t]);

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
    // Use basePoint if available, otherwise use selectedLocation
    const circleCenter = basePoint || selectedLocation;
    if (radius && radius > 0 && circleCenter) {
      const circle = new window.google.maps.Circle({
        center: { lat: circleCenter.lat, lng: circleCenter.lng },
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

    // Only create marker for selectedLocation if it's different from basePoint
    if (basePoint && basePoint.lat === selectedLocation.lat && basePoint.lng === selectedLocation.lng) {
      // selectedLocation is the same as basePoint, don't create duplicate marker
      return;
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
  }, [selectedLocation, basePoint, isLoaded, radius, t]);

  // Auto-adjust map zoom and bounds when radius or basePoint changes
  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      return;
    }

    // Only auto-adjust if we have both basePoint and radius
    if (!basePoint || !radius || radius <= 0) {
      isAutoAdjustingRef.current = false;
      return;
    }

    console.log('🔄 Auto-adjusting map view for radius:', radius, 'basePoint:', basePoint);
    isAutoAdjustingRef.current = true;

    // Use a small delay to avoid conflicts with other map operations
    const timeoutId = setTimeout(() => {
      if (!mapRef.current || !basePoint) {
        isAutoAdjustingRef.current = false;
        return;
      }

      // Calculate the bounds to fit the circle
      // Convert radius from meters to degrees (approximate)
      // At the equator, 1 degree ≈ 111,320 meters
      // We need to account for latitude
      const latRad = (basePoint.lat * Math.PI) / 180;
      const metersPerDegreeLat = 111320;
      const metersPerDegreeLng = 111320 * Math.cos(latRad);

      const latOffset = radius / metersPerDegreeLat;
      const lngOffset = radius / metersPerDegreeLng;

      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(
          basePoint.lat - latOffset,
          basePoint.lng - lngOffset
        ),
        new window.google.maps.LatLng(
          basePoint.lat + latOffset,
          basePoint.lng + lngOffset
        )
      );

      // Fit the map to show the entire circle with comfortable padding
      // Calculate padding to make circle occupy approximately 88-92% of the viewport
      const mapDiv = mapRef.current.getDiv();
      const viewportWidth = mapDiv ? mapDiv.clientWidth : 800;
      const viewportHeight = mapDiv ? mapDiv.clientHeight : 600;
      
      // Target: circle should occupy about 88-92% of the smaller viewport dimension
      // This means padding should be about 4-6% on each side (8-12% total, leaving 88-92% for circle)
      const viewportMin = Math.min(viewportWidth, viewportHeight);
      const targetCircleOccupancy = 0.90; // Circle occupies 90% of viewport (5% padding on each side)
      const targetCircleSize = viewportMin * targetCircleOccupancy;
      
      // Calculate circle diameter in degrees
      const circleDiameterLat = (radius * 2) / metersPerDegreeLat;
      const circleDiameterLng = (radius * 2) / metersPerDegreeLng;
      
      // Get current zoom level to estimate circle size in pixels
      const currentZoom = mapRef.current.getZoom() || 16;
      
      // Estimate pixels per degree at current zoom
      // Google Maps uses Mercator projection: pixels = 256 * 2^zoom / 360 degrees
      const pixelsPerDegreeLat = (256 * Math.pow(2, currentZoom)) / 360;
      const pixelsPerDegreeLng = pixelsPerDegreeLat * Math.cos(latRad);
      
      // Calculate circle diameter in pixels (use the larger dimension to ensure it fits)
      const circleDiameterPixelsLat = circleDiameterLat * pixelsPerDegreeLat;
      const circleDiameterPixelsLng = circleDiameterLng * pixelsPerDegreeLng;
      const circleDiameterPixels = Math.max(circleDiameterPixelsLat, circleDiameterPixelsLng);
      
      // Calculate required padding to achieve target circle size
      // If circle is smaller than target, we need more padding
      // If circle is larger than target, we need less padding (but still ensure it fits)
      const circleRatio = circleDiameterPixels / viewportMin;
      
      let finalPadding: number;
      
      if (circleRatio <= targetCircleOccupancy) {
        // Circle is smaller than or equal to target size
        // Calculate padding to make circle occupy target percentage of viewport
        // Formula: circleDiameter = viewportMin - (padding * 2)
        // So: padding = (viewportMin - circleDiameter) / 2
        // But we want: circleDiameter = viewportMin * targetCircleOccupancy
        // So: padding = (viewportMin - viewportMin * targetCircleOccupancy) / 2
        finalPadding = (viewportMin - targetCircleSize) / 2;
      } else {
        // Circle is larger than target size
        // Use minimum padding to ensure circle fits with comfortable margin
        // Use 5% padding (circle will occupy ~90% of viewport)
        finalPadding = viewportMin * 0.05;
      }
      
      // Ensure padding is within reasonable bounds
      // Minimum: 25px for very small screens (allows circle to occupy up to 92%)
      // Maximum: 12% of viewport or 80px, whichever is smaller
      const minPadding = Math.max(25, viewportMin * 0.02);
      const maxPadding = Math.min(viewportMin * 0.12, 80);
      finalPadding = Math.max(Math.min(finalPadding, maxPadding), minPadding);
      
      console.log('📍 Fitting bounds with optimized padding:', {
        center: { lat: basePoint.lat, lng: basePoint.lng },
        radius,
        viewport: { width: viewportWidth, height: viewportHeight, min: viewportMin },
        circleDiameterPixels: circleDiameterPixels.toFixed(0),
        targetCircleSize: targetCircleSize.toFixed(0),
        circleRatio: circleRatio.toFixed(2),
        finalPadding: finalPadding.toFixed(0),
        circleOccupancy: ((circleDiameterPixels / (viewportMin + finalPadding * 2)) * 100).toFixed(1) + '%',
      });
      
      mapRef.current.fitBounds(bounds, finalPadding);

      // Reset flag after a short delay
      setTimeout(() => {
        isAutoAdjustingRef.current = false;
      }, 500);
    }, 300); // Small delay to batch updates and avoid conflicts

    return () => {
      clearTimeout(timeoutId);
      isAutoAdjustingRef.current = false;
    };
  }, [basePoint, radius, isLoaded]);

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
                <li>API Key 是否存在: {googleMapsApiKey ? '是' : '否'}</li>
                <li>格式看似正確: {googleMapsApiKey?.startsWith('AIza') ? '是' : '否'}</li>
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

  // Show error if script failed (avoid leaking raw error that may contain API key)
  if (scriptError || loadError) {
    const displayError = loadError || 'Google Maps 載入失敗，請檢查 API Key、網域限制與配額。';
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4 max-w-md">
          <p className="text-red-600 font-semibold text-lg mb-2">Google Maps 載入失敗</p>
          <p className="text-sm text-gray-600 mt-2 mb-4">{displayError}</p>
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

  const isApiLoaded = scriptLoaded && typeof window !== 'undefined' && !!window.google?.maps;

  const mapElement = (
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
  );

  // If script still loading, show loading state
  if (!scriptLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        Loading Google Maps...
      </div>
    );
  }

  // If API already loaded, render map directly (useJsApiLoader prevents double load)
  if (isApiLoaded) {
    return <div className="w-full h-full">{mapElement}</div>;
  }

  // Fallback: should rarely happen because scriptLoaded implies API present
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      Loading Google Maps...
    </div>
  );
}

