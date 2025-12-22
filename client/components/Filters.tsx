'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { FilterParams, Place } from '@/utils/types';
import PlaceCard from './PlaceCard';
import Link from 'next/link';

interface FiltersProps {
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
  onReset?: () => void;
  filteredPlaces?: Place[];
  selectedPlace?: Place | null;
  onPlaceSelect?: (place: Place) => void;
}

export default function Filters({ filters, onChange, onReset, filteredPlaces = [], selectedPlace, onPlaceSelect }: FiltersProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [localFilters, setLocalFilters] = useState<FilterParams>(filters);
  const [radiusInput, setRadiusInput] = useState<string>(String(filters.radius ?? 2000));
  const [ratingInput, setRatingInput] = useState<string>(String(filters.rating_min ?? 0));

  // Sync localFilters with filters prop when it changes
  useEffect(() => {
    setLocalFilters(filters);
    setRadiusInput(String(filters.radius ?? 2000));
    setRatingInput(String(filters.rating_min ?? 0));
  }, [filters]);

  const handleChange = (key: keyof FilterParams, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    console.log('Filter changed:', key, value, newFilters);
    onChange(newFilters);
  };

  const handleCategoryToggle = (category: string) => {
    const categories = localFilters.categories || [];
    const newCategories = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category];
    handleChange('categories', newCategories);
  };

  const handleFeatureToggle = (feature: string) => {
    const features = localFilters.features || [];
    const newFeatures = features.includes(feature)
      ? features.filter((f) => f !== feature)
      : [...features, feature];
    handleChange('features', newFeatures);
  };

  const resetFilters = () => {
    const defaultFilters: FilterParams = {
      lat: 25.0170,
      lng: 121.5395,
      radius: 2000,
      rating_min: 0,
      price_max: 4,
    };
    setLocalFilters(defaultFilters);
    onChange(defaultFilters);
    // Notify parent to reset selected location
    if (onReset) {
      onReset();
    }
  };

  const commonCategories = ['餐廳', '咖啡廳', '小吃', '夜市', '速食', '日式', '中式', '西式'];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Distance Section */}
      <div className="space-y-2 md:space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2 md:mb-3">
            {t('filters.maxDistance')}
          </h3>
          <div className="space-y-2">
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={localFilters.radius || 2000}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setRadiusInput(String(value));
                handleChange('radius', value);
              }}
              className="w-full h-2 bg-divider rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={radiusInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setRadiusInput(value);
                  const parsed = parseInt(value);
                  // 允許清空；僅當輸入在合法範圍內時才即時同步，避免中途被強制跳到 100
                  if (!Number.isNaN(parsed) && parsed >= 100 && parsed <= 5000) {
                    handleChange('radius', parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(radiusInput);
                  const fallback = localFilters.radius ?? 2000;
                  const clamped = Number.isNaN(parsed)
                    ? fallback
                    : Math.max(100, Math.min(5000, parsed));
                  setRadiusInput(String(clamped));
                  handleChange('radius', clamped);
                }}
                className="w-20 px-2 py-1 border border-divider rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              <span className="text-sm font-medium text-text-primary">m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-divider pt-4 md:pt-6"></div>

      {/* Rating Section */}
      <div className="space-y-2 md:space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2 md:mb-3">
            {t('filters.minRating')}
          </h3>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={localFilters.rating_min || 0}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setRatingInput(String(value));
                handleChange('rating_min', value);
              }}
              className="w-full h-2 bg-divider rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">Rating ≥</span>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={ratingInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setRatingInput(value);
                  const parsed = parseFloat(value);
                  if (!Number.isNaN(parsed)) {
                    const clampedValue = Math.max(0, Math.min(5, parsed));
                    handleChange('rating_min', clampedValue);
                  }
                }}
                onBlur={() => {
                  const parsed = parseFloat(ratingInput);
                  const fallback = 0;
                  const clamped = Number.isNaN(parsed)
                    ? fallback
                    : Math.max(0, Math.min(5, parsed));
                  setRatingInput(String(clamped));
                  handleChange('rating_min', clamped);
                }}
                className="w-20 px-2 py-1 border border-divider rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-divider pt-4 md:pt-6"></div>

      {/* Price Section */}
      <div className="space-y-2 md:space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2 md:mb-3">
            {t('filters.price')}
          </h3>
          <select
            value={localFilters.price_max || 4}
            onChange={(e) => handleChange('price_max', parseInt(e.target.value))}
            className="w-full border border-divider rounded-xl px-4 py-2.5 text-sm text-text-primary bg-white hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
          >
            <option value={4}>{t('filters.priceLevel.4')} - {t('filters.priceLevelName.4')}</option>
            <option value={3}>{t('filters.priceLevel.3')} - {t('filters.priceLevelName.3')}</option>
            <option value={2}>{t('filters.priceLevel.2')} - {t('filters.priceLevelName.2')}</option>
            <option value={1}>{t('filters.priceLevel.1')} - {t('filters.priceLevelName.1')}</option>
          </select>
        </div>
      </div>

      <div className="border-t border-divider pt-4 md:pt-6"></div>

      {/* Categories Section */}
      <div className="space-y-2 md:space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2 md:mb-3">
            {t('filters.categories')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {commonCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
                  localFilters.categories?.includes(cat)
                    ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700'
                    : 'bg-white text-text-secondary border border-divider hover:border-primary-600 hover:text-primary-600'
                }`}
              >
                {t(`filters.categoryNames.${cat}`) || cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-divider pt-4 md:pt-6"></div>

      {/* Features Section */}
      <div className="space-y-2 md:space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2 md:mb-3">
            {t('filters.features')}
          </h3>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={localFilters.open_now || false}
                onChange={(e) => handleChange('open_now', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-divider rounded focus:ring-primary-600 focus:ring-2 cursor-pointer"
              />
              <span className="ml-3 text-sm text-text-primary group-hover:text-primary-600 transition-colors">
                {t('filters.openNow')}
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-divider pt-4 md:pt-6"></div>

      {/* Reset Button */}
      <button
        onClick={resetFilters}
        className="w-full px-4 py-2 md:py-2.5 bg-white text-text-secondary border border-divider rounded-xl font-medium hover:bg-gray-50 hover:border-primary-600 hover:text-primary-600 transition-all shadow-sm text-sm md:text-base"
      >
        {t('common.reset')}
      </button>

      {/* Filtered Places List */}
      <div className="border-t border-divider pt-4 md:pt-6 mt-4 md:mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3 md:mb-4">
          {t('filters.filteredResults')} ({filteredPlaces.length})
        </h3>
        <div className="space-y-3 md:space-y-4">
          {filteredPlaces.length === 0 ? (
            <div className="text-sm text-text-secondary text-center py-4">
              {t('common.noResults')}
            </div>
          ) : (
            filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => onPlaceSelect?.(place)}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedPlace?.id === place.id
                    ? 'ring-2 ring-primary-600 rounded-lg'
                    : 'hover:shadow-md'
                }`}
              >
                <PlaceCard place={place} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

