'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilterParams } from '@/utils/types';

interface FiltersProps {
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
}

export default function Filters({ filters, onChange }: FiltersProps) {
  const t = useTranslations();
  const [localFilters, setLocalFilters] = useState<FilterParams>(filters);

  const handleChange = (key: keyof FilterParams, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
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
  };

  const commonCategories = ['餐廳', '咖啡廳', '小吃', '夜市', '速食', '日式', '中式', '西式'];
  const commonFeatures = ['international_friendly', 'vegetarian', 'halal', 'wifi', 'parking'];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('filters.maxDistance')} (m)
        </label>
        <input
          type="range"
          min="500"
          max="5000"
          step="500"
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
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value={4}>{t('filters.priceLevel.4')}</option>
          <option value={3}>{t('filters.priceLevel.3')}</option>
          <option value={2}>{t('filters.priceLevel.2')}</option>
          <option value={1}>{t('filters.priceLevel.1')}</option>
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
              {cat}
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
            <span className="text-sm">{t('filters.openNow')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.features?.includes('international_friendly') || false}
              onChange={() => handleFeatureToggle('international_friendly')}
              className="mr-2"
            />
            <span className="text-sm">{t('filters.internationalFriendly')}</span>
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

