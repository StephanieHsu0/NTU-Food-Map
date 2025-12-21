'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProfileEditForm from '@/components/ProfileEditForm';
import UserCommentsList from '@/components/UserCommentsList';
import UserFavoritesList from '@/components/UserFavoritesList';

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  image: string | null;
  provider: string | null;
  comment_count: number;
  favorite_count: number;
  created_at: string | null;
  updated_at: string | null;
}

type TabType = 'comments' | 'favorites';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('comments');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/signin`);
      return;
    }

    if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, locale, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/${locale}/auth/signin`);
          return;
        }
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: { name: string; email?: string; image: string | null }) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('profile.edit.saveFailed'));
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditing(false);
      
      // Refresh session to update user info
      window.location.reload();
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">{t('common.loading')}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{t('profile.error.loading')}</p>
      </div>
    );
  }

  const initial = profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-divider p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-divider bg-gray-100 overflow-hidden flex items-center justify-center">
                {profile.image ? (
                  <Image
                    src={profile.image}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-400 font-semibold">{initial}</span>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-2xl font-bold text-text-primary mb-2 break-words overflow-wrap-anywhere">{profile.name}</h1>
              <p className="text-text-secondary mb-4 break-words overflow-wrap-anywhere">{profile.email}</p>
              
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{profile.comment_count}</p>
                  <p className="text-sm text-text-secondary">{t('profile.stats.comments')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{profile.favorite_count}</p>
                  <p className="text-sm text-text-secondary">{t('profile.stats.favorites')}</p>
                </div>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {editing ? t('profile.cancelEdit') : t('profile.editButton')}
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="bg-white rounded-xl shadow-sm border border-divider p-6 mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              {t('profile.editTitle')}
            </h2>
            <ProfileEditForm
              initialData={{
                name: profile.name,
                email: profile.email,
                image: profile.image,
              }}
              provider={profile.provider}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-divider mb-6">
          <div className="flex border-b border-divider">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-6 py-3 text-center font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('profile.tabs.comments')} ({profile.comment_count})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 px-6 py-3 text-center font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('profile.tabs.favorites')} ({profile.favorite_count})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'comments' ? (
              <UserCommentsList userId={profile.user_id} />
            ) : (
              <UserFavoritesList userId={profile.user_id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

