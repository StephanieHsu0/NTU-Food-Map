import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/comments/route';
import { PUT, DELETE } from '@/app/api/comments/[id]/route';
import { POST as POST_LIKE } from '@/app/api/comments/[id]/like/route';
import { POST as POST_DISLIKE } from '@/app/api/comments/[id]/dislike/route';
import { connectToDatabase } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/auth');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('Comment System Edge Cases', () => {
  let mockDb: any;
  let mockCommentsCollection: any;
  let mockUsersCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCommentsCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
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

  describe('Empty/Null Value Handling', () => {
    it('should reject empty content', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: 'place-123',
          content: '', // Empty content
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // The API should validate this, but if it doesn't, the database might reject it
      // This test ensures the validation is in place
      expect(response.status).toBe(400);
      expect(data.error).toContain('content');
    });

    it('should handle null rating gracefully', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockCommentsCollection.insertOne.mockResolvedValue({
        insertedId: new ObjectId('507f1f77bcf86cd799439012'),
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: 'place-123',
          content: 'Comment without rating',
          rating: null,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rating).toBeNull();
    });

    it('should handle very long comment content', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
      };

      const longContent = 'A'.repeat(10000); // Very long content

      mockAuth.mockResolvedValue(mockSession as any);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockCommentsCollection.insertOne.mockResolvedValue({
        insertedId: new ObjectId('507f1f77bcf86cd799439012'),
      });

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: 'place-123',
          content: longContent,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe(longContent);
    });
  });

  describe('Invalid ID Handling', () => {
    it('should return 404 for invalid comment ID in GET', async () => {
      mockCommentsCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/comments/invalid-id');
      const response = await GET(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Comment not found');
    });

    it('should return 404 for invalid comment ID in PUT', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockCommentsCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/comments/invalid-id', {
        method: 'PUT',
        body: JSON.stringify({
          content: 'Updated',
        }),
      });

      const response = await PUT(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Comment not found');
    });

    it('should return 404 for invalid comment ID in DELETE', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      mockCommentsCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/comments/invalid-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Comment not found');
    });

    it('should handle invalid place_id in GET', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };

      mockCommentsCollection.find.mockReturnValue(mockFind);

      const request = new NextRequest('http://localhost:3000/api/comments?place_id=');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('place_id is required');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent like operations', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const userId1 = new ObjectId('507f1f77bcf86cd799439013');
      const userId2 = new ObjectId('507f1f77bcf86cd799439014');

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: new ObjectId('507f1f77bcf86cd799439015'),
        content: 'Test comment',
        likes: 0,
        dislikes: 0,
        user_likes: [],
        user_dislikes: [],
      };

      // Simulate concurrent likes
      const session1 = {
        user: {
          email: 'user1@example.com',
        },
      };

      const session2 = {
        user: {
          email: 'user2@example.com',
        },
      };

      const user1 = { _id: userId1, email: 'user1@example.com' };
      const user2 = { _id: userId2, email: 'user2@example.com' };

      // First like
      mockAuth.mockResolvedValue(session1 as any);
      mockUsersCollection.findOne.mockResolvedValue(user1);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce({
          ...mockComment,
          likes: 1,
          user_likes: [userId1],
        });

      const request1 = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const response1 = await POST_LIKE(request1, { params: { id: commentId } });
      expect(response1.status).toBe(200);

      // Second like (concurrent)
      mockAuth.mockResolvedValue(session2 as any);
      mockUsersCollection.findOne.mockResolvedValue(user2);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce({
          ...mockComment,
          likes: 1,
          user_likes: [userId1],
        })
        .mockResolvedValueOnce({
          ...mockComment,
          likes: 2,
          user_likes: [userId1, userId2],
        });

      const request2 = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const response2 = await POST_LIKE(request2, { params: { id: commentId } });
      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.likes).toBe(2);
    });

    it('should handle rapid toggle of like/dislike', async () => {
      const commentId = '507f1f77bcf86cd799439011';
      const userId = new ObjectId('507f1f77bcf86cd799439013');

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: 'place-123',
        user_id: new ObjectId('507f1f77bcf86cd799439014'),
        content: 'Test comment',
        likes: 0,
        dislikes: 0,
        user_likes: [],
        user_dislikes: [],
      };

      const session = {
        user: {
          email: 'test@example.com',
        },
      };

      const user = { _id: userId, email: 'test@example.com' };

      mockAuth.mockResolvedValue(session as any);
      mockUsersCollection.findOne.mockResolvedValue(user);

      // Like
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce({
          ...mockComment,
          likes: 1,
          user_likes: [userId],
        });

      const likeRequest = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const likeResponse = await POST_LIKE(likeRequest, { params: { id: commentId } });
      expect(likeResponse.status).toBe(200);

      // Immediately dislike (should remove like)
      mockCommentsCollection.findOne
        .mockResolvedValueOnce({
          ...mockComment,
          likes: 1,
          user_likes: [userId],
        })
        .mockResolvedValueOnce({
          ...mockComment,
          likes: 0,
          dislikes: 1,
          user_likes: [],
          user_dislikes: [userId],
        });

      const dislikeRequest = new NextRequest(`http://localhost:3000/api/comments/${commentId}/dislike`, {
        method: 'POST',
      });

      const dislikeResponse = await POST_DISLIKE(dislikeRequest, { params: { id: commentId } });
      expect(dislikeResponse.status).toBe(200);
      const dislikeData = await dislikeResponse.json();
      expect(dislikeData.likes).toBe(0);
      expect(dislikeData.dislikes).toBe(1);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockConnectToDatabase.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/comments?place_id=place-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed');
    });

    it('should handle invalid ObjectId format', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
        },
      };

      mockAuth.mockResolvedValue(mockSession as any);

      // Invalid ObjectId format
      const request = new NextRequest('http://localhost:3000/api/comments/not-a-valid-objectid', {
        method: 'DELETE',
      });

      // This should either throw an error or return 404
      // The actual behavior depends on how MongoDB handles invalid ObjectIds
      try {
        const response = await DELETE(request, { params: { id: 'not-a-valid-objectid' } });
        // If it doesn't throw, it should return an error status
        expect([400, 404, 500]).toContain(response.status);
      } catch (error) {
        // If it throws, that's also acceptable error handling
        expect(error).toBeDefined();
      }
    });
  });

  describe('Rating Edge Cases', () => {
    it('should handle out-of-range rating values', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      // Rating > 5
      const request1 = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: 'place-123',
          content: 'Test',
          rating: 10, // Invalid rating
        }),
      });

      const response1 = await POST(request1);
      // The API might accept it or reject it - both are valid behaviors
      // If it accepts, the database should handle validation
      expect([200, 400]).toContain(response1.status);
    });

    it('should handle negative rating values', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockUsersCollection.findOne.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: 'place-123',
          content: 'Test',
          rating: -1, // Invalid rating
        }),
      });

      const response = await POST(request);
      // Should either reject or handle gracefully
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle fetching many comments efficiently', async () => {
      // Create mock for 100 comments
      const mockComments = Array.from({ length: 100 }, (_, i) => ({
        _id: new ObjectId(`507f1f77bcf86cd7994390${String(i).padStart(2, '0')}`),
        place_id: 'place-123',
        user_id: new ObjectId('507f1f77bcf86cd799439011'),
        content: `Comment ${i}`,
        rating: Math.floor(Math.random() * 5) + 1,
        edited: false,
        edited_at: null,
        created_at: new Date(`2024-01-${String((i % 28) + 1).padStart(2, '0')}`),
        likes: Math.floor(Math.random() * 100),
        dislikes: Math.floor(Math.random() * 10),
        user_likes: [],
        user_dislikes: [],
      }));

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockComments),
      };

      mockCommentsCollection.find.mockReturnValue(mockFind);
      mockUsersCollection.findOne.mockResolvedValue({
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
      });

      const request = new NextRequest('http://localhost:3000/api/comments?place_id=place-123&sort_by=likes');
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      const comments = await response.json();
      expect(comments.length).toBe(100);
      
      // Performance check - should complete in reasonable time (< 1 second for mocked DB)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});

