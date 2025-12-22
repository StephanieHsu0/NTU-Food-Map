import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/comments/[id]/route';
import { connectToDatabase } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/auth');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/comments/[id]', () => {
  let mockDb: any;
  let mockCommentsCollection: any;
  let mockUsersCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCommentsCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
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

  describe('GET /api/comments/[id]', () => {
    it('should fetch a single comment', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: new ObjectId('507f1f77bcf86cd799439013'),
        content: 'Test comment',
        rating: 5,
        edited: false,
        edited_at: null,
        created_at: new Date('2024-01-01'),
        likes: 10,
        dislikes: 0,
        user_likes: [],
        user_dislikes: [],
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439013'),
        name: 'Test User',
        image: 'avatar.jpg',
      };

      mockCommentsCollection.findOne.mockResolvedValue(mockComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`);
      const response = await GET(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(commentId);
      expect(data.content).toBe('Test comment');
      expect(data.user_name).toBe('Test User');
      expect(mockCommentsCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId(commentId),
      });
    });

    it('should return 404 if comment not found', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      mockCommentsCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`);
      const response = await GET(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Comment not found');
    });
  });

  describe('PUT /api/comments/[id]', () => {
    it('should allow author to edit their own comment', async () => {
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
        user_id: userId,
        content: 'Old content',
        rating: 3,
        edited: false,
        edited_at: null,
        created_at: new Date('2024-01-01'),
        likes: 0,
        dislikes: 0,
        user_likes: [],
        user_dislikes: [],
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        name: 'Test User',
      };

      const updatedComment = {
        ...mockComment,
        content: 'Updated content',
        rating: 5,
        edited: true,
        edited_at: new Date(),
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(updatedComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: 'Updated content',
          rating: 5,
        }),
      });

      const response = await PUT(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe('Updated content');
      expect(data.rating).toBe(5);
      expect(data.edited).toBe(true);
      expect(mockCommentsCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(commentId) },
        expect.objectContaining({
          $set: expect.objectContaining({
            content: 'Updated content',
            edited: true,
            rating: 5,
          }),
        })
      );
    });

    it('should prevent non-author from editing', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const commentAuthorId = new ObjectId('507f1f77bcf86cd799439013');
      const differentUserId = new ObjectId('507f1f77bcf86cd799439014');

      const mockSession = {
        user: {
          email: 'other@example.com',
          name: 'Other User',
        },
      };

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: commentAuthorId,
        content: 'Original content',
        created_at: new Date('2024-01-01'),
      };

      const mockUser = {
        _id: differentUserId,
        email: 'other@example.com',
        name: 'Other User',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne.mockResolvedValue(mockComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: 'Hacked content',
        }),
      });

      const response = await PUT(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
      expect(mockCommentsCollection.updateOne).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: 'Updated content',
        }),
      });

      const response = await PUT(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should update edited flag and edited_at timestamp', async () => {
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
        user_id: userId,
        content: 'Original',
        edited: false,
        created_at: new Date('2024-01-01'),
        likes: 0,
        dislikes: 0,
        user_likes: [],
        user_dislikes: [],
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce({
          ...mockComment,
          content: 'Updated',
          edited: true,
          edited_at: new Date(),
        });
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: 'Updated',
        }),
      });

      const response = await PUT(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.edited).toBe(true);
      expect(data.edited_at).toBeTruthy();
    });
  });

  describe('DELETE /api/comments/[id]', () => {
    it('should allow author to delete their own comment', async () => {
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
        user_id: userId,
        content: 'To be deleted',
        created_at: new Date('2024-01-01'),
      };

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne.mockResolvedValue(mockComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockCommentsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCommentsCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(commentId),
      });
    });

    it('should prevent non-author from deleting', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const commentAuthorId = new ObjectId('507f1f77bcf86cd799439013');
      const differentUserId = new ObjectId('507f1f77bcf86cd799439014');

      const mockSession = {
        user: {
          email: 'other@example.com',
          name: 'Other User',
        },
      };

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: commentAuthorId,
        content: 'Protected comment',
        created_at: new Date('2024-01-01'),
      };

      const mockUser = {
        _id: differentUserId,
        email: 'other@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockCommentsCollection.findOne.mockResolvedValue(mockComment);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
      expect(mockCommentsCollection.deleteOne).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: commentId } });
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

      const request = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: commentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Comment not found');
    });
  });
});

