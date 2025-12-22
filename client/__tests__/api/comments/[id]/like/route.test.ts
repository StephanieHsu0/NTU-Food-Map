import { NextRequest } from 'next/server';
import { POST } from '@/app/api/comments/[id]/like/route';
import { connectToDatabase } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/auth');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/comments/[id]/like', () => {
  let mockDb: any;
  let mockCommentsCollection: any;
  let mockUsersCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCommentsCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
    };

    mockUsersCollection = {
      findOne: jest.fn(),
    };

    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === 'comments') return mockCommentsCollection;
        if (name === 'users') return mockUsersCollection;
        return {};
      }),
    };

    mockConnectToDatabase.mockResolvedValue(mockDb as any);
  });

  describe('POST /api/comments/[id]/like', () => {
    it('should add a like to a comment', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const userId = new ObjectId('507f1f77bcf86cd799439013');

      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: new ObjectId('507f1f77bcf86cd799439014'),
        content: 'Test comment',
        likes: 5,
        dislikes: 0,
        user_likes: [],
        user_dislikes: [],
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      const updatedComment = {
        ...mockComment,
        likes: 6,
        user_likes: [userId],
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(updatedComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.likes).toBe(6);
      expect(data.user_liked).toBe(true);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $addToSet: { user_likes: userId },
          $inc: { likes: 1 },
        })
      );
    });

    it('should remove like when user already liked (toggle)', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const userId = new ObjectId('507f1f77bcf86cd799439013');

      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: new ObjectId('507f1f77bcf86cd799439014'),
        content: 'Test comment',
        likes: 6,
        dislikes: 0,
        user_likes: [userId],
        user_dislikes: [],
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      const updatedComment = {
        ...mockComment,
        likes: 5,
        user_likes: [],
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(updatedComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.likes).toBe(5);
      expect(data.user_liked).toBe(false);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $pull: { user_likes: userId },
          $inc: { likes: -1 },
        })
      );
    });

    it('should remove dislike when adding like', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const userId = new ObjectId('507f1f77bcf86cd799439013');

      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: new ObjectId('507f1f77bcf86cd799439014'),
        content: 'Test comment',
        likes: 5,
        dislikes: 3,
        user_likes: [],
        user_dislikes: [userId],
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      const updatedComment = {
        ...mockComment,
        likes: 6,
        dislikes: 2,
        user_likes: [userId],
        user_dislikes: [],
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(updatedComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.likes).toBe(6);
      expect(data.dislikes).toBe(2);
      expect(data.user_liked).toBe(true);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $addToSet: { user_likes: userId },
          $pull: { user_dislikes: userId },
          $inc: { likes: 1, dislikes: -1 },
        })
      );
    });

    it('should prevent duplicate likes', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const userId = new ObjectId('507f1f77bcf86cd799439013');

      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: new ObjectId('507f1f77bcf86cd799439014'),
        content: 'Test comment',
        likes: 5,
        dislikes: 0,
        user_likes: [userId], // Already liked
        user_dislikes: [],
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne.mockResolvedValue(mockComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      // Should toggle (remove like) instead of adding duplicate
      expect(response.status).toBe(200);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $pull: { user_likes: userId },
          $inc: { likes: -1 },
        })
      );
    });

    it('should reject unauthenticated users', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if comment not found', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const userId = new ObjectId('507f1f77bcf86cd799439013');

      const mockSession = {
        user: {
          email: 'test@example.com',
        },
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne.mockResolvedValue(null);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Comment not found');
    });
  });
});

