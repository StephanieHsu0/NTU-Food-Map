'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Comment {
  id: string;
  place_id: string;
  place_name_zh: string | null;
  place_name_en: string | null;
  content: string;
  rating: number | null;
  edited: boolean;
  edited_at: string | null;
  created_at: string;
  likes: number;
  dislikes: number;
}

interface UserCommentsListProps {
  userId: string;
}

export default function UserCommentsList({ userId }: UserCommentsListProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadComments();
  }, [page]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/comments?page=${page}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }

      const data = await response.json();
      if (page === 1) {
        setComments(data.comments);
      } else {
        setComments((prev) => [...prev, ...data.comments]);
      }
      setHasMore(data.pagination.page < data.pagination.total_pages);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPlaceName = (comment: Comment) => {
    if (locale === 'zh') {
      return comment.place_name_zh || comment.place_name_en || t('profile.comments.unknownPlace');
    }
    return comment.place_name_en || comment.place_name_zh || t('profile.comments.unknownPlace');
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-text-secondary">{t('common.loading')}</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">{t('profile.comments.noComments')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border border-divider rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2 gap-2">
            <Link
              href={`/${locale}/place/${comment.place_id}`}
              prefetch={true}
              className="text-lg font-semibold text-primary-600 hover:text-primary-700 transition-colors break-words overflow-wrap-anywhere flex-1 min-w-0"
              onMouseEnter={() => {
                // Prefetch on hover for faster navigation
                router.prefetch(`/${locale}/place/${comment.place_id}`);
              }}
            >
              {getPlaceName(comment)}
            </Link>
            {comment.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm font-medium">{comment.rating}</span>
              </div>
            )}
          </div>

          <p className="text-text-primary mb-3 whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center justify-between text-sm text-text-secondary">
            <div className="flex items-center gap-4">
              <span>{formatDate(comment.created_at)}</span>
              {comment.edited && (
                <span className="text-xs italic">{t('profile.comments.edited')}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span>👍</span>
                <span>{comment.likes}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>👎</span>
                <span>{comment.dislikes}</span>
              </span>
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="px-4 py-2 border border-divider rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') : t('profile.comments.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}

