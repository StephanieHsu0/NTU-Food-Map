import { NextRequest } from 'next/server';
import { POST } from '@/app/api/comments/[id]/dislike/route';
import { connectToDatabase } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/auth');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/comments/[id]/dislike', () => {
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

  describe('POST /api/comments/[id]/dislike', () => {
    it('should add a dislike to a comment', async () => {
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
        dislikes: 2,
        user_likes: [],
        user_dislikes: [],
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      const updatedComment = {
        ...mockComment,
        dislikes: 3,
        user_dislikes: [userId],
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(updatedComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/dislike`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dislikes).toBe(3);
      expect(data.user_disliked).toBe(true);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $addToSet: { user_dislikes: userId },
          $inc: { dislikes: 1 },
        })
      );
    });

    it('should remove dislike when user already disliked (toggle)', async () => {
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
        dislikes: 2,
        user_dislikes: [],
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(updatedComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/dislike`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dislikes).toBe(2);
      expect(data.user_disliked).toBe(false);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $pull: { user_dislikes: userId },
          $inc: { dislikes: -1 },
        })
      );
    });

    it('should remove like when adding dislike', async () => {
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
        dislikes: 2,
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
        dislikes: 3,
        user_likes: [],
        user_dislikes: [userId],
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(updatedComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/dislike`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.likes).toBe(5);
      expect(data.dislikes).toBe(3);
      expect(data.user_disliked).toBe(true);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $addToSet: { user_dislikes: userId },
          $pull: { user_likes: userId },
          $inc: { likes: -1, dislikes: 1 },
        })
      );
    });

    it('should prevent duplicate dislikes', async () => {
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
        user_dislikes: [userId], // Already disliked
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne.mockResolvedValue(mockComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/dislike`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      // Should toggle (remove dislike) instead of adding duplicate
      expect(response.status).toBe(200);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $pull: { user_dislikes: userId },
          $inc: { dislikes: -1 },
        })
      );
    });

    it('should reject unauthenticated users', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/dislike`, {
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

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}/dislike`, {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Comment not found');
    });
  });
});

