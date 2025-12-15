'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface Comment {
  id: string;
  place_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  rating: number | null;
  edited: boolean;
  edited_at: string | null;
  created_at: string;
  likes: number;
  dislikes: number;
  user_likes: string[];
  user_dislikes: string[];
}

interface CommentSectionProps {
  placeId: string;
}

export default function CommentSection({ placeId }: CommentSectionProps) {
  const t = useTranslations();
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'likes'>('time');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formContent, setFormContent] = useState('');
  const [formRating, setFormRating] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    if (session) {
      loadCurrentUserId();
    }
  }, [placeId, sortBy, session]);

  const loadCurrentUserId = async () => {
    try {
      const response = await fetch('/api/user/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.user_id);
      }
    } catch (error) {
      console.error('Error loading current user ID:', error);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments?place_id=${placeId}&sort_by=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    try {
      if (editingId) {
        // Update existing comment
        const response = await fetch(`/api/comments/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: formContent,
            rating: formRating,
          }),
        });
        if (response.ok) {
          await loadComments();
          setEditingId(null);
          setFormContent('');
          setFormRating(null);
        }
      } else {
        // Create new comment
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            place_id: placeId,
            content: formContent,
            rating: formRating,
          }),
        });
        if (response.ok) {
          await loadComments();
          setFormContent('');
          setFormRating(null);
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('comments.deleteComment') + '?')) return;

    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleLike = async (id: string) => {
    if (!session) {
      alert(t('auth.signInToComment'));
      return;
    }

    try {
      const response = await fetch(`/api/comments/${id}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadComments();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDislike = async (id: string) => {
    if (!session) {
      alert(t('auth.signInToComment'));
      return;
    }

    try {
      const response = await fetch(`/api/comments/${id}/dislike`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadComments();
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setFormContent(comment.content);
    setFormRating(comment.rating || null);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormContent('');
    setFormRating(null);
    setShowForm(false);
  };

  // Get current user ID from session

  if (loading) {
    return <div className="text-gray-600">{t('common.loading')}</div>;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">{t('comments.title')}</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">{t('comments.sortBy')}:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'time' | 'likes')}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="time">{t('comments.sortByTime')}</option>
            <option value="likes">{t('comments.sortByLikes')}</option>
          </select>
        </div>
      </div>

      {session && (showForm || comments.length === 0) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('comments.commentContent')}
            </label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              rows={4}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('comments.selectRating')}
            </label>
            <select
              value={formRating || ''}
              onChange={(e) => setFormRating(e.target.value ? parseInt(e.target.value) : null)}
              className="border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            >
              <option value="">{t('common.close')}</option>
              <option value="5">5 ⭐</option>
              <option value="4">4 ⭐</option>
              <option value="3">3 ⭐</option>
              <option value="2">2 ⭐</option>
              <option value="1">1 ⭐</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {editingId ? t('comments.editComment') : t('comments.addComment')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                {t('comments.cancel')}
              </button>
            )}
          </div>
        </form>
      )}

      {!session && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">{t('auth.signInToComment')}</p>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-gray-600">{t('comments.noComments')}</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            // Check if current user is the author by comparing user_id
            const isAuthor = currentUserId && comment.user_id === currentUserId;
            // Check if current user liked/disliked
            const userLiked = currentUserId && comment.user_likes.includes(currentUserId);
            const userDisliked = currentUserId && comment.user_dislikes.includes(currentUserId);

            return (
              <div key={comment.id} className="border-b border-gray-200 pb-4">
                <div className="flex items-start gap-3">
                  {comment.user_avatar && (
                    <Image
                      src={comment.user_avatar}
                      alt={comment.user_name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{comment.user_name}</span>
                      {comment.rating && (
                        <span className="text-yellow-500">⭐ {comment.rating}</span>
                      )}
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {comment.edited && (
                        <span className="text-xs text-gray-500">
                          ({t('comments.edited')}
                          {comment.edited_at && ` ${new Date(comment.edited_at).toLocaleDateString()}`})
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(comment.id)}
                        className={`flex items-center gap-1 text-sm ${
                          userLiked ? 'text-blue-600 font-semibold' : 'text-gray-600'
                        }`}
                      >
                        👍 {comment.likes}
                      </button>
                      <button
                        onClick={() => handleDislike(comment.id)}
                        className={`flex items-center gap-1 text-sm ${
                          userDisliked ? 'text-red-600 font-semibold' : 'text-gray-600'
                        }`}
                      >
                        👎 {comment.dislikes}
                      </button>
                      {isAuthor && (
                        <>
                          <button
                            onClick={() => startEdit(comment)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {t('comments.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            {t('comments.delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
