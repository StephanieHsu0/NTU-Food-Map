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
        className="px-3 py-1.5 md:w-9 md:h-9 md:px-0 md:py-0 rounded-lg md:rounded-full border border-divider bg-white text-text-secondary hover:text-primary-600 hover:border-primary-200 shadow-sm hover:shadow-md transition-all flex items-center justify-center text-sm font-semibold"
        aria-label={t('usageInstructions.button')}
      >
        ?
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-divider px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary">{t('usageInstructions.title')}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-text-secondary hover:text-text-primary text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Features Section */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-text-primary">
              {t('usageInstructions.sections.features.title')}
            </h3>
            <ul className="space-y-2 list-disc list-inside text-text-secondary">
              {t.raw('usageInstructions.sections.features.content').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Design Section */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-text-primary">
              {t('usageInstructions.sections.design.title')}
            </h3>
            
            {/* Price Standard */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-text-primary">
                {t('usageInstructions.sections.design.priceStandard.title')}
              </h4>
              <p className="text-text-secondary mb-3">
                {t('usageInstructions.sections.design.priceStandard.content')}
              </p>
              <ul className="space-y-2 ml-4">
                <li className="text-text-secondary">
                  {t('usageInstructions.sections.design.priceStandard.levels.1')}
                </li>
                <li className="text-text-secondary">
                  {t('usageInstructions.sections.design.priceStandard.levels.2')}
                </li>
                <li className="text-text-secondary">
                  {t('usageInstructions.sections.design.priceStandard.levels.3')}
                </li>
                <li className="text-text-secondary">
                  {t('usageInstructions.sections.design.priceStandard.levels.4')}
                </li>
              </ul>
            </div>

            {/* Rating Standard */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-text-primary">
                {t('usageInstructions.sections.design.ratingStandard.title')}
              </h4>
              <p className="text-text-secondary">
                {t('usageInstructions.sections.design.ratingStandard.content')}
              </p>
            </div>

            {/* Distance Standard */}
            <div>
              <h4 className="text-lg font-semibold mb-2 text-text-primary">
                {t('usageInstructions.sections.design.distanceStandard.title')}
              </h4>
              <p className="text-text-secondary">
                {t('usageInstructions.sections.design.distanceStandard.content')}
              </p>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-divider px-6 py-4 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm hover:shadow-md"
          >
            {t('usageInstructions.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

