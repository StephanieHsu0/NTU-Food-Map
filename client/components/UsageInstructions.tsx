'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function UsageInstructions() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        {t('usageInstructions.button')}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('usageInstructions.title')}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Features Section */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              {t('usageInstructions.sections.features.title')}
            </h3>
            <ul className="space-y-2 list-disc list-inside text-gray-700">
              {t.raw('usageInstructions.sections.features.content').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Design Section */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              {t('usageInstructions.sections.design.title')}
            </h3>
            
            {/* Price Standard */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-gray-800">
                {t('usageInstructions.sections.design.priceStandard.title')}
              </h4>
              <p className="text-gray-700 mb-3">
                {t('usageInstructions.sections.design.priceStandard.content')}
              </p>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">
                  {t('usageInstructions.sections.design.priceStandard.levels.1')}
                </li>
                <li className="text-gray-700">
                  {t('usageInstructions.sections.design.priceStandard.levels.2')}
                </li>
                <li className="text-gray-700">
                  {t('usageInstructions.sections.design.priceStandard.levels.3')}
                </li>
                <li className="text-gray-700">
                  {t('usageInstructions.sections.design.priceStandard.levels.4')}
                </li>
              </ul>
            </div>

            {/* Rating Standard */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-gray-800">
                {t('usageInstructions.sections.design.ratingStandard.title')}
              </h4>
              <p className="text-gray-700">
                {t('usageInstructions.sections.design.ratingStandard.content')}
              </p>
            </div>

            {/* Distance Standard */}
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-800">
                {t('usageInstructions.sections.design.distanceStandard.title')}
              </h4>
              <p className="text-gray-700">
                {t('usageInstructions.sections.design.distanceStandard.content')}
              </p>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {t('usageInstructions.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
