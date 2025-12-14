'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { FilterParams } from '@/utils/types';

interface FiltersProps {
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
  onReset?: () => void;
}

export default function Filters({ filters, onChange, onReset }: FiltersProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [localFilters, setLocalFilters] = useState<FilterParams>(filters);

  // Sync localFilters with filters prop when it changes
  useEffect(() => {
    setLocalFilters(filters);
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('filters.maxDistance')} (m)
        </label>
        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={localFilters.radius || 2000}
          onChange={(e) => handleChange('radius', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-gray-600">{localFilters.radius || 2000} m</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('filters.minRating')}
        </label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={localFilters.rating_min || 0}
          onChange={(e) => handleChange('rating_min', parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-gray-600">{localFilters.rating_min || 0}</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('filters.price')} (Max)
        </label>
        <select
          value={localFilters.price_max || 4}
          onChange={(e) => handleChange('price_max', parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
        >
          <option value={4}>{t('filters.priceLevel.4')} - {t('filters.priceLevelName.4')}</option>
          <option value={3}>{t('filters.priceLevel.3')} - {t('filters.priceLevelName.3')}</option>
          <option value={2}>{t('filters.priceLevel.2')} - {t('filters.priceLevelName.2')}</option>
          <option value={1}>{t('filters.priceLevel.1')} - {t('filters.priceLevelName.1')}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('filters.categories')}
        </label>
        <div className="flex flex-wrap gap-2">
          {commonCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryToggle(cat)}
              className={`px-3 py-1 rounded-full text-sm ${
                localFilters.categories?.includes(cat)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t(`filters.categoryNames.${cat}`) || cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('filters.features')}
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.open_now || false}
              onChange={(e) => handleChange('open_now', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-900">{t('filters.openNow')}</span>
          </label>
        </div>
      </div>

      <button
        onClick={resetFilters}
        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
      >
        {t('common.reset')}
      </button>
    </div>
  );
}

