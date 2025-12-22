'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import AvatarUpload from './AvatarUpload';

interface ProfileEditFormProps {
  initialData: {
    name: string;
    email: string;
    image: string | null;
  };
  provider?: string | null;
  onSave: (data: { name: string; email?: string; image: string | null }) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileEditForm({
  initialData,
  provider,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const t = useTranslations();
  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);
  const [image, setImage] = useState<string | null>(initialData.image);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is OAuth account
  const isOAuthAccount = provider === 'google' || provider === 'line';

  useEffect(() => {
    setName(initialData.name);
    setEmail(initialData.email);
    setImage(initialData.image);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate
      if (!name.trim()) {
        throw new Error(t('profile.edit.nameRequired'));
      }

      if (name.trim().length > 50) {
        throw new Error(t('profile.edit.nameTooLong'));
      }

      // Only validate email if not OAuth account
      if (!isOAuthAccount) {
        if (!email.trim()) {
          throw new Error(t('profile.edit.emailRequired'));
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          throw new Error(t('profile.edit.invalidEmail'));
        }
      }

      // Build save data - don't include email for OAuth accounts
      const saveData: { name: string; email?: string; image: string | null } = {
        name: name.trim(),
        image,
      };

      // Only include email if not OAuth account
      if (!isOAuthAccount) {
        saveData.email = email.trim();
      }

      await onSave(saveData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.edit.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <AvatarUpload
          currentAvatar={image}
          onUploadSuccess={(url) => setImage(url)}
        />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="name" className="block text-sm font-medium text-text-primary">
              {t('profile.edit.name')}
            </label>
            <span className="text-xs text-text-secondary">
              {name.length}/50
            </span>
          </div>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            maxLength={50}
            placeholder={t('profile.edit.name')}
          />
          {name.length >= 45 && (
            <p className="mt-1 text-xs text-yellow-600">
              {t('profile.edit.nameLengthWarning')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
            {t('profile.edit.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-2 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              isOAuthAccount ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            required
            disabled={isOAuthAccount}
            readOnly={isOAuthAccount}
          />
          {isOAuthAccount && (
            <p className="mt-1 text-xs text-text-secondary">
              {t('profile.edit.emailOAuthHint')}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border border-divider rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? t('profile.edit.saving') : t('profile.edit.save')}
        </button>
      </div>
    </form>
  );
}

