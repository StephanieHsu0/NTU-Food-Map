'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUploadSuccess: (url: string) => void;
  userId?: string;
}

type UploadMode = 'file' | 'url';

export default function AvatarUpload({
  currentAvatar,
  onUploadSuccess,
  userId,
}: AvatarUploadProps) {
  const t = useTranslations();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<UploadMode>('file');
  const [urlInput, setUrlInput] = useState('');
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('profile.avatar.invalidType'));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('profile.avatar.fileTooLarge'));
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('profile.avatar.uploadFailed'));
      }

      const data = await response.json();
      setPreview(data.url);
      onUploadSuccess(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.avatar.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setUrlInput(url);
    setError(null);
    setUrlPreview(null);

    if (url) {
      // Validate URL format - must be a complete URL
      try {
        // Check if it's a data URL first
        if (url.startsWith('data:image/')) {
          setUrlPreview(url);
          return;
        }

        // Must start with http:// or https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          setError(t('profile.avatar.urlMustStartWithHttp'));
          return;
        }

        const urlObj = new URL(url);
        
        // Basic validation - URL must have a valid hostname
        if (!urlObj.hostname || urlObj.hostname.length === 0) {
          setError(t('profile.avatar.invalidUrl'));
          return;
        }

        // Set preview - let the image load to verify
        setUrlPreview(url);
      } catch {
        // Invalid URL format
        setError(t('profile.avatar.invalidUrl'));
        setUrlPreview(null);
      }
    } else {
      setUrlPreview(null);
    }
  };

  const handleApplyUrl = () => {
    const url = urlInput.trim();
    
    if (!url) {
      setError(t('profile.avatar.urlRequired'));
      return;
    }

    // Validate URL format
    try {
      if (url.startsWith('data:image/')) {
        // Data URL is valid
        setPreview(url);
        onUploadSuccess(url);
        setError(null);
        return;
      }

      // Must be a complete HTTP/HTTPS URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setError(t('profile.avatar.urlMustStartWithHttp'));
        return;
      }

      const urlObj = new URL(url);
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        setError(t('profile.avatar.invalidUrl'));
        return;
      }

      // If preview failed, don't allow applying
      if (!urlPreview) {
        setError(t('profile.avatar.imageLoadFailed'));
        return;
      }

      setPreview(url);
      onUploadSuccess(url);
      setError(null);
    } catch {
      setError(t('profile.avatar.invalidUrl'));
    }
  };

  const handleModeChange = (newMode: UploadMode) => {
    setMode(newMode);
    setError(null);
    if (newMode === 'url') {
      setUrlInput('');
      setUrlPreview(null);
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-4 border-divider bg-gray-100 overflow-hidden flex items-center justify-center">
          {(preview || (mode === 'url' && urlPreview)) ? (
            <Image
              src={preview || urlPreview || ''}
              alt={t('profile.avatar.alt')}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              onError={() => {
                if (mode === 'url') {
                  setError(t('profile.avatar.imageLoadFailed'));
                  setUrlPreview(null);
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl text-gray-400">
                {t('profile.avatar.placeholder')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        {/* Mode Tabs */}
        <div className="flex border border-divider rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => handleModeChange('file')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'file'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-text-secondary hover:bg-gray-50'
            }`}
          >
            {t('profile.avatar.uploadFile')}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('url')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'url'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-text-secondary hover:bg-gray-50'
            }`}
          >
            {t('profile.avatar.pasteUrl')}
          </button>
        </div>

        {/* File Upload Mode */}
        {mode === 'file' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer text-center text-sm font-medium"
            >
              {t('profile.avatar.selectFile')}
            </label>

            {fileInputRef.current?.files?.[0] && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {uploading ? t('profile.avatar.uploading') : t('profile.avatar.upload')}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}

            <p className="text-xs text-text-secondary text-center">
              {t('profile.avatar.hint')}
            </p>
          </>
        )}

        {/* URL Input Mode */}
        {mode === 'url' && (
          <>
            <div className="space-y-2">
              <input
                type="url"
                value={urlInput}
                onChange={handleUrlChange}
                placeholder={t('profile.avatar.urlPlaceholder')}
                className="w-full px-4 py-2 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              {urlPreview && (
                <div className="w-full h-32 border border-divider rounded-lg overflow-hidden bg-gray-100 relative">
                  <img
                    src={urlPreview}
                    alt={t('profile.avatar.preview')}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setError(t('profile.avatar.imageLoadFailed'));
                      setUrlPreview(null);
                    }}
                    onLoad={() => {
                      setError(null);
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim() || uploading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {t('profile.avatar.applyUrl')}
              </button>
            </div>
            <p className="text-xs text-text-secondary text-center">
              {t('profile.avatar.urlHint')}
            </p>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

