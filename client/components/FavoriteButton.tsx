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
    return <div className="text-gray-600">{t('common.loading')}</div>;
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleToggleFavorite}
        className={`px-4 py-2 rounded-md transition-colors ${
          favorited
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {favorited ? '❤️ ' + t('favorites.removeFromFavorites') : '🤍 ' + t('favorites.addToFavorites')}
      </button>

      {favorited && (
        <div className="mt-4">
          {note && !showNoteForm && (
            <div className="p-3 bg-gray-50 rounded-lg mb-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{t('favorites.note')}:</span> {note}
              </p>
              <button
                onClick={() => setShowNoteForm(true)}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                {t('favorites.editNote')}
              </button>
            </div>
          )}

          {showNoteForm && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('favorites.addNote')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNote}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                >
                  {t('favorites.saveNote')}
                </button>
                <button
                  onClick={() => {
                    setShowNoteForm(false);
                    checkFavorite(); // Reset note from server
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                >
                  {t('comments.cancel')}
                </button>
              </div>
            </div>
          )}

          {!note && !showNoteForm && (
            <button
              onClick={() => setShowNoteForm(true)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              {t('favorites.addNote')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

