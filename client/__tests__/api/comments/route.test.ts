import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/comments/route';
import { connectToDatabase } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/auth');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/comments', () => {
  let mockDb: any;
  let mockCommentsCollection: any;
  let mockUsersCollection: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock collections
    mockCommentsCollection = {
      find: jest.fn(),
      insertOne: jest.fn(),
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

  describe('POST /api/comments', () => {
    it('should create a new comment successfully', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
          image: null,
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        name: 'Test User',
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
          content: 'Great place!',
          rating: 5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe('Great place!');
      expect(data.rating).toBe(5);
      expect(data.place_id).toBe('place-123');
      expect(mockCommentsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          place_id: 'place-123',
          content: 'Great place!',
          rating: 5,
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
          edited: false,
        })
      );
    });

    it('should reject unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: 'place-123',
          content: 'Great place!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockCommentsCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should require place_id and content', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockAuth.mockResolvedValue(mockSession as any);

      // Missing place_id
      const request1 = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Great place!',
        }),
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(400);
      expect(data1.error).toContain('place_id');

      // Missing content
      const request2 = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: 'place-123',
        }),
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(data2.error).toContain('content');
    });

    it('should allow optional rating field', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockUser = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        name: 'Test User',
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
          content: 'Great place!',
          // No rating provided
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rating).toBeNull();
      expect(mockCommentsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: null,
        })
      );
    });

    it('should handle user not found', async () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockUsersCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: 'place-123',
          content: 'Great place!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('GET /api/comments', () => {
    it('should fetch comments by place_id', async () => {
      const mockComments = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          place_id: 'place-123',
          user_id: new ObjectId('507f1f77bcf86cd799439013'),
          content: 'Comment 1',
          rating: 5,
          edited: false,
          edited_at: null,
          created_at: new Date('2024-01-01'),
          likes: 10,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439012'),
          place_id: 'place-123',
          user_id: new ObjectId('507f1f77bcf86cd799439014'),
          content: 'Comment 2',
          rating: 4,
          edited: false,
          edited_at: null,
          created_at: new Date('2024-01-02'),
          likes: 5,
          dislikes: 1,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      const mockUsers = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439013'),
          name: 'User 1',
          image: 'avatar1.jpg',
        },
        {
          _id: new ObjectId('507f1f77bcf86cd799439014'),
          name: 'User 2',
          image: null,
        },
      ];

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockComments),
      };

      mockCommentsCollection.find.mockReturnValue(mockFind);
      mockUsersCollection.findOne
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1]);

      const request = new NextRequest('http://localhost:3000/api/comments?place_id=place-123&sort_by=time');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0].content).toBe('Comment 1');
      expect(data[0].user_name).toBe('User 1');
      expect(data[1].user_name).toBe('User 2');
      expect(mockCommentsCollection.find).toHaveBeenCalledWith({ place_id: 'place-123' });
      expect(mockFind.sort).toHaveBeenCalledWith({ created_at: -1 });
    });

    it('should sort by likes when sort_by=likes', async () => {
      const mockComments = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          place_id: 'place-123',
          user_id: new ObjectId('507f1f77bcf86cd799439013'),
          content: 'Comment 1',
          created_at: new Date('2024-01-01'),
          likes: 5,
          dislikes: 0,
        },
      ];

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockComments),
      };

      mockCommentsCollection.find.mockReturnValue(mockFind);
      mockUsersCollection.findOne.mockResolvedValue({
        _id: new ObjectId('507f1f77bcf86cd799439013'),
        name: 'User 1',
      });

      const request = new NextRequest('http://localhost:3000/api/comments?place_id=place-123&sort_by=likes');

      await GET(request);

      expect(mockFind.sort).toHaveBeenCalledWith({ likes: -1, created_at: -1 });
    });

    it('should require place_id parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/comments');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('place_id is required');
    });

    it('should default to time sorting', async () => {
      const mockComments: any[] = [];
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockComments),
      };

      mockCommentsCollection.find.mockReturnValue(mockFind);

      const request = new NextRequest('http://localhost:3000/api/comments?place_id=place-123');

      await GET(request);

      expect(mockFind.sort).toHaveBeenCalledWith({ created_at: -1 });
    });
  });
});

