'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
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
}

export default function Map({ places, selectedPlace, onPlaceSelect, center }: MapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindowPlace, setInfoWindowPlace] = useState<Place | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY || '';

  // Debug: Log API key status (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Google Maps API Key status:', {
        hasKey: !!googleMapsApiKey,
        keyLength: googleMapsApiKey.length,
        keyPreview: googleMapsApiKey ? `${googleMapsApiKey.substring(0, 10)}...` : 'empty',
      });
    }
  }, [googleMapsApiKey]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.setCenter({ lat: center[0], lng: center[1] });
      mapRef.current.setZoom(16);
    }
  }, [center, isLoaded]);

  const getMarkerIcon = (place: Place, isSelected: boolean): google.maps.Symbol | undefined => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) {
      return undefined;
    }
    const color = isSelected ? '#0ea5e9' : '#10b981';
    // Create a custom SVG icon
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    };
  };

  const handleMarkerClick = (place: Place) => {
    setInfoWindowPlace(place);
    onPlaceSelect(place);
  };

  const handleInfoWindowClose = () => {
    setInfoWindowPlace(null);
  };

  if (!googleMapsApiKey || googleMapsApiKey === 'XXX') {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">Google Maps API Key 未設定</p>
          <p className="text-sm text-gray-600 mt-2">
            請在 .env 中設定 NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <LoadScript 
        googleMapsApiKey={googleMapsApiKey}
        loadingElement={<div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Google Maps...</div>}
        onError={(error) => {
          console.error('Google Maps LoadScript error:', error);
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: center[0], lng: center[1] }}
          zoom={16}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onError={(error) => {
            console.error('Google Maps error:', error);
          }}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {places.map((place) => {
            const isSelected = selectedPlace?.id === place.id;
            return (
              <Marker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
                icon={isLoaded ? getMarkerIcon(place, isSelected) : undefined}
                onClick={() => handleMarkerClick(place)}
                label={{
                  text: place.price_level.toString(),
                  color: 'white',
                  fontSize: '12px',
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
                <h3 className="font-semibold text-sm mb-1">{infoWindowPlace.name_zh}</h3>
                <p className="text-xs text-gray-600 mb-2">{infoWindowPlace.name_en}</p>
                <div className="text-xs space-y-1">
                  <div>
                    <span>⭐ {infoWindowPlace.rating.toFixed(1)}</span>
                    <span className="ml-2">{'$'.repeat(infoWindowPlace.price_level)}</span>
                  </div>
                  {infoWindowPlace.distance_m && (
                    <div className="text-gray-600">
                      {(infoWindowPlace.distance_m / 1000).toFixed(2)} km
                    </div>
                  )}
                  <button
                    onClick={() => {
                      onPlaceSelect(infoWindowPlace);
                      handleInfoWindowClose();
                    }}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    查看詳情
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

