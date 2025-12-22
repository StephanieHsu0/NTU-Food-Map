import React from 'react';
import { renderWithProviders, userEvent, screen, waitFor } from '../utils/test-utils';
import CommentSection from '@/components/CommentSection';

// Mock fetch
global.fetch = jest.fn();

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('CommentSection', () => {
  const mockPlaceId = 'place-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render comment section with title', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />);

      expect(await screen.findByText('comments.title')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<CommentSection placeId={mockPlaceId} />);

      expect(screen.getByText('common.loading')).toBeInTheDocument();
    });

    it('should display no comments message when empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />);

      expect(await screen.findByText('comments.noComments')).toBeInTheDocument();
    });

    it('should display comments list', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-1',
          user_name: 'User One',
          user_avatar: 'https://example.com/avatar1.jpg',
          content: 'Great place!',
          rating: 5,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 10,
          dislikes: 2,
          user_likes: [],
          user_dislikes: [],
        },
        {
          id: 'comment-2',
          place_id: mockPlaceId,
          user_id: 'user-2',
          user_name: 'User Two',
          user_avatar: null,
          content: 'Nice food',
          rating: 4,
          edited: true,
          edited_at: '2024-01-02T00:00:00Z',
          created_at: '2024-01-01T12:00:00Z',
          likes: 5,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      expect(await screen.findByText('Great place!')).toBeInTheDocument();
      expect(await screen.findByText('Nice food')).toBeInTheDocument();
      expect(await screen.findByText('User One')).toBeInTheDocument();
      expect(await screen.findByText('User Two')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should allow switching between time and likes sorting', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-1',
          user_name: 'User One',
          user_avatar: null,
          content: 'Comment 1',
          rating: null,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 5,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Comment 1')).toBeInTheDocument();
      });

      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toBeInTheDocument();

      // Change to likes sorting
      await userEvent.selectOptions(sortSelect, 'likes');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sort_by=likes'),
          undefined
        );
      });
    });
  });

  describe('Adding Comments', () => {
    it('should show comment form for logged in users', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      expect(await screen.findByLabelText('comments.commentContent')).toBeInTheDocument();
      expect(await screen.findByLabelText('comments.selectRating')).toBeInTheDocument();
    });

    it('should not show comment form for unauthenticated users', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: null,
      });

      await waitFor(() => {
        expect(screen.queryByLabelText('comments.commentContent')).not.toBeInTheDocument();
      });

      expect(screen.getByText('auth.signInToComment')).toBeInTheDocument();
    });

    it('should submit new comment', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'new-comment',
            place_id: mockPlaceId,
            user_id: 'user-1',
            content: 'New comment',
            rating: 5,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              id: 'new-comment',
              place_id: mockPlaceId,
              user_id: 'user-1',
              user_name: 'User One',
              user_avatar: null,
              content: 'New comment',
              rating: 5,
              edited: false,
              edited_at: null,
              created_at: '2024-01-01T00:00:00Z',
              likes: 0,
              dislikes: 0,
              user_likes: [],
              user_dislikes: [],
            },
          ],
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      const textarea = await screen.findByLabelText('comments.commentContent');
      const ratingSelect = screen.getByLabelText('comments.selectRating');
      const submitButton = screen.getByText('comments.addComment');

      await userEvent.type(textarea, 'New comment');
      await userEvent.selectOptions(ratingSelect, '5');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/comments',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('New comment'),
          })
        );
      });
    });
  });

  describe('Editing Comments', () => {
    it('should show edit button only for comment author', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-1', // Current user is author
          user_name: 'User One',
          user_avatar: null,
          content: 'My comment',
          rating: 5,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
        {
          id: 'comment-2',
          place_id: mockPlaceId,
          user_id: 'user-2', // Different user
          user_name: 'User Two',
          user_avatar: null,
          content: 'Other comment',
          rating: null,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      const editButtons = await screen.findAllByText('comments.edit');
      expect(editButtons.length).toBe(1); // Only one edit button for own comment
    });

    it('should allow editing own comment', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-1',
          user_name: 'User One',
          user_avatar: null,
          content: 'Original comment',
          rating: 3,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'comment-1',
            content: 'Updated comment',
            rating: 5,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              ...mockComments[0],
              content: 'Updated comment',
              rating: 5,
              edited: true,
            },
          ],
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      const editButton = await screen.findByText('comments.edit');
      await userEvent.click(editButton);

      const textarea = await screen.findByDisplayValue('Original comment');
      expect(textarea).toBeInTheDocument();

      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Updated comment');

      const submitButton = screen.getByText('comments.editComment');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/comments/comment-1',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });
  });

  describe('Deleting Comments', () => {
    it('should allow deleting own comment', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-1',
          user_name: 'User One',
          user_avatar: null,
          content: 'To be deleted',
          rating: null,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      const deleteButton = await screen.findByText('comments.delete');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/comments/comment-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('Like/Dislike', () => {
    it('should handle like button click', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-2',
          user_name: 'User Two',
          user_avatar: null,
          content: 'Test comment',
          rating: null,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 5,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ likes: 6, dislikes: 0 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              ...mockComments[0],
              likes: 6,
            },
          ],
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      const likeButton = await screen.findByText(/👍/);
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/comments/comment-1/like',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('should show sign in prompt for unauthenticated users trying to like', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-2',
          user_name: 'User Two',
          user_avatar: null,
          content: 'Test comment',
          rating: null,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 5,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      // Mock window.alert
      window.alert = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: null,
      });

      const likeButton = await screen.findByText(/👍/);
      await userEvent.click(likeButton);

      expect(window.alert).toHaveBeenCalledWith('auth.signInToComment');
    });
  });

  describe('Rating Display', () => {
    it('should display rating stars', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-1',
          user_name: 'User One',
          user_avatar: null,
          content: 'Great place!',
          rating: 5,
          edited: false,
          edited_at: null,
          created_at: '2024-01-01T00:00:00Z',
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      expect(await screen.findByText(/⭐ 5/)).toBeInTheDocument();
    });
  });

  describe('Edited Mark', () => {
    it('should display edited mark for edited comments', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          place_id: mockPlaceId,
          user_id: 'user-1',
          user_name: 'User One',
          user_avatar: null,
          content: 'Edited comment',
          rating: null,
          edited: true,
          edited_at: '2024-01-02T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'user-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        });

      renderWithProviders(<CommentSection placeId={mockPlaceId} />, {
        session: {
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            image: null,
          },
          expires: '2024-12-31',
        },
      });

      expect(await screen.findByText(/comments.edited/)).toBeInTheDocument();
    });
  });
});

