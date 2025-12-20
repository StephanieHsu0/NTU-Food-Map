'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface FavoriteButtonProps {
  placeId: string;
}

export default function FavoriteButton({ placeId }: FavoriteButtonProps) {
  const t = useTranslations();
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      checkFavorite();
    } else {
      setLoading(false);
    }
  }, [placeId, session]);

  const checkFavorite = async () => {
    try {
      const response = await fetch(`/api/favorites/check?place_id=${placeId}`);
      if (response.ok) {
        const data = await response.json();
        setFavorited(data.favorited);
        setFavoriteId(data.favorite_id);
        setNote(data.note || '');
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!session) {
      alert(t('auth.signInToFavorite'));
      return;
    }

    try {
      if (favorited && favoriteId) {
        // Remove favorite
        const response = await fetch(`/api/favorites/${favoriteId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setFavorited(false);
          setFavoriteId(null);
          setNote('');
        }
      } else {
        // Add favorite
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            place_id: placeId,
            note: note || null,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setFavorited(true);
          setFavoriteId(data.id);
          setNote(data.note || '');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!favoriteId) return;

    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (response.ok) {
        setShowNoteForm(false);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  if (loading) {
    return <div className="text-text-secondary">{t('common.loading')}</div>;
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleToggleFavorite}
        className={`px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${
          favorited
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-white text-text-secondary border border-divider hover:border-primary-600 hover:text-primary-600'
        }`}
      >
        {favorited ? '❤️ ' + t('favorites.removeFromFavorites') : '🤍 ' + t('favorites.addToFavorites')}
      </button>

      {favorited && (
        <div className="mt-4">
          {note && !showNoteForm && (
            <div className="p-4 bg-white border border-divider rounded-xl mb-2 shadow-sm">
              <p className="text-sm text-text-primary">
                <span className="font-semibold">{t('favorites.note')}:</span> {note}
              </p>
              <button
                onClick={() => setShowNoteForm(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 transition-colors"
              >
                {t('favorites.editNote')}
              </button>
            </div>
          )}

          {showNoteForm && (
            <div className="p-4 bg-white border border-divider rounded-xl shadow-sm">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('favorites.addNote')}
                className="w-full border border-divider rounded-xl px-4 py-2.5 text-text-primary mb-3 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700 transition-all font-medium shadow-sm"
                >
                  {t('favorites.saveNote')}
                </button>
                <button
                  onClick={() => {
                    setShowNoteForm(false);
                    checkFavorite(); // Reset note from server
                  }}
                  className="px-4 py-2 bg-white text-text-secondary border border-divider text-sm rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  {t('comments.cancel')}
                </button>
              </div>
            </div>
          )}

          {!note && !showNoteForm && (
            <button
              onClick={() => setShowNoteForm(true)}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {t('favorites.addNote')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

