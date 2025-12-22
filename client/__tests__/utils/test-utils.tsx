import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';

// Mock translations
const messages = {
  common: {
    loading: 'Loading...',
    cancel: 'Cancel',
  },
  comments: {
    title: 'Comments',
    addComment: 'Add Comment',
    editComment: 'Edit Comment',
    deleteComment: 'Delete Comment',
    commentContent: 'Comment Content',
    submit: 'Submit',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    like: 'Like',
    dislike: 'Dislike',
    likes: 'Likes',
    dislikes: 'Dislikes',
    edited: 'Edited',
    sortBy: 'Sort By',
    sortByTime: 'Post Time',
    sortByLikes: 'Like Count',
    noComments: 'No comments yet',
    rating: 'Rating',
    selectRating: 'Select Rating (Optional)',
  },
  auth: {
    signInToComment: 'Sign in to comment',
  },
};

// Mock session
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
  expires: '2024-12-31',
};

// Custom render function that includes providers
export function renderWithProviders(
  ui: React.ReactElement,
  {
    session = mockSession,
    locale = 'en',
    ...renderOptions
  }: RenderOptions & { session?: typeof mockSession; locale?: string } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </SessionProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock MongoDB functions
export const mockDb = {
  collection: jest.fn((name: string) => ({
    findOne: jest.fn(),
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      toArray: jest.fn(),
    })),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  })),
};

// Mock auth function
export const mockAuth = jest.fn();

// Helper to create mock comment
export const createMockComment = (overrides = {}) => ({
  _id: { toString: () => 'comment-id-1' },
  place_id: 'place-id-1',
  user_id: { toString: () => 'user-id-1' },
  content: 'Test comment',
  rating: 5,
  edited: false,
  edited_at: null,
  created_at: new Date('2024-01-01'),
  likes: 0,
  dislikes: 0,
  user_likes: [],
  user_dislikes: [],
  ...overrides,
});

// Helper to create mock user
export const createMockUser = (overrides = {}) => ({
  _id: { toString: () => 'user-id-1' },
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  ...overrides,
});

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

