'use client';

import { useTranslations } from 'next-intl';
import type { ScoreBreakdown } from '@/utils/types';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
}

export default function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const t = useTranslations();

  const components = [
    { key: 'rating', label: t('scoreBreakdown.rating'), value: breakdown.rating },
    { key: 'distance', label: t('scoreBreakdown.distance'), value: breakdown.distance },
    { key: 'popularity', label: t('scoreBreakdown.popularity'), value: breakdown.popularity },
    { key: 'open', label: t('scoreBreakdown.openStatus'), value: breakdown.open },
    { key: 'context', label: t('scoreBreakdown.context'), value: breakdown.context },
  ];

  const maxValue = Math.max(...components.map((c) => c.value), 1);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">{t('scoreBreakdown.title')}</h3>
      <div className="space-y-3">
        {components.map((component) => (
          <div key={component.key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{component.label}</span>
              <span className="font-semibold">{component.value.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${(component.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <div className="pt-2 border-t mt-2">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900">{t('common.total')}</span>
            <span className="font-bold text-primary-600">{breakdown.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

