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

describe('Comment System Integration Tests', () => {
  let mockDb: any;
  let mockCommentsCollection: any;
  let mockUsersCollection: any;

  const user1Id = new ObjectId('507f1f77bcf86cd799439011');
  const user2Id = new ObjectId('507f1f77bcf86cd799439012');
  const placeId = 'place-123';

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

  describe('Complete Comment Lifecycle', () => {
    it('should handle full comment lifecycle: create -> edit -> like -> dislike -> delete', async () => {
      const commentId = '507f1f77bcf86cd799439013';
      let commentData: any = null;

      // Step 1: Create comment
      const createSession = {
        user: {
          email: 'user1@example.com',
          name: 'User One',
        },
      };

      const user1 = {
        _id: user1Id,
        email: 'user1@example.com',
        name: 'User One',
      };

      mockAuth.mockResolvedValue(createSession as any);
      mockUsersCollection.findOne.mockResolvedValue(user1);
      mockCommentsCollection.insertOne.mockImplementation((data: any) => {
        commentData = {
          _id: new ObjectId(commentId),
          ...data,
        };
        return { insertedId: new ObjectId(commentId) };
      });

      const createRequest = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: placeId,
          content: 'Initial comment',
          rating: 4,
        }),
      });

      const createResponse = await POST(createRequest);
      expect(createResponse.status).toBe(200);
      expect(commentData).toBeTruthy();
      expect(commentData.content).toBe('Initial comment');

      // Step 2: Edit comment
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(commentData)
        .mockResolvedValueOnce({
          ...commentData,
          content: 'Updated comment',
          rating: 5,
          edited: true,
          edited_at: new Date(),
        });

      const editRequest = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: 'Updated comment',
          rating: 5,
        }),
      });

      const editResponse = await PUT(editRequest, { params: { id: commentId } });
      expect(editResponse.status).toBe(200);
      const editData = await editResponse.json();
      expect(editData.content).toBe('Updated comment');
      expect(editData.edited).toBe(true);

      // Step 3: Like comment (by user2)
      const likeSession = {
        user: {
          email: 'user2@example.com',
          name: 'User Two',
        },
      };

      const user2 = {
        _id: user2Id,
        email: 'user2@example.com',
        name: 'User Two',
      };

      mockAuth.mockResolvedValue(likeSession as any);
      mockUsersCollection.findOne.mockResolvedValue(user2);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce({
          ...commentData,
          content: 'Updated comment',
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        })
        .mockResolvedValueOnce({
          ...commentData,
          content: 'Updated comment',
          likes: 1,
          dislikes: 0,
          user_likes: [user2Id],
          user_dislikes: [],
        });

      const likeRequest = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const likeResponse = await POST_LIKE(likeRequest, { params: { id: commentId } });
      expect(likeResponse.status).toBe(200);
      const likeData = await likeResponse.json();
      expect(likeData.likes).toBe(1);
      expect(likeData.user_liked).toBe(true);

      // Step 4: Dislike comment (switches from like)
      mockCommentsCollection.findOne
        .mockResolvedValueOnce({
          ...commentData,
          content: 'Updated comment',
          likes: 1,
          dislikes: 0,
          user_likes: [user2Id],
          user_dislikes: [],
        })
        .mockResolvedValueOnce({
          ...commentData,
          content: 'Updated comment',
          likes: 0,
          dislikes: 1,
          user_likes: [],
          user_dislikes: [user2Id],
        });

      const dislikeRequest = new NextRequest(`http://localhost:3000/api/comments/${commentId}/dislike`, {
        method: 'POST',
      });

      const dislikeResponse = await POST_DISLIKE(dislikeRequest, { params: { id: commentId } });
      expect(dislikeResponse.status).toBe(200);
      const dislikeData = await dislikeResponse.json();
      expect(dislikeData.likes).toBe(0);
      expect(dislikeData.dislikes).toBe(1);
      expect(dislikeData.user_disliked).toBe(true);

      // Step 5: Delete comment (by author)
      mockAuth.mockResolvedValue(createSession as any);
      mockUsersCollection.findOne.mockResolvedValue(user1);
      mockCommentsCollection.findOne.mockResolvedValue({
        ...commentData,
        content: 'Updated comment',
        user_id: user1Id,
      });
      mockCommentsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const deleteRequest = new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const deleteResponse = await DELETE(deleteRequest, { params: { id: commentId } });
      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle multiple users commenting on same place', async () => {
      const comment1Id = '507f1f77bcf86cd799439013';
      const comment2Id = '507f1f77bcf86cd799439014';

      // User 1 creates comment
      const user1Session = {
        user: {
          email: 'user1@example.com',
          name: 'User One',
        },
      };

      const user1 = {
        _id: user1Id,
        email: 'user1@example.com',
        name: 'User One',
      };

      mockAuth.mockResolvedValue(user1Session as any);
      mockUsersCollection.findOne.mockResolvedValue(user1);
      mockCommentsCollection.insertOne
        .mockResolvedValueOnce({ insertedId: new ObjectId(comment1Id) })
        .mockResolvedValueOnce({ insertedId: new ObjectId(comment2Id) });

      const request1 = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: placeId,
          content: 'Comment from User 1',
          rating: 5,
        }),
      });

      const response1 = await POST(request1);
      expect(response1.status).toBe(200);

      // User 2 creates comment
      const user2Session = {
        user: {
          email: 'user2@example.com',
          name: 'User Two',
        },
      };

      const user2 = {
        _id: user2Id,
        email: 'user2@example.com',
        name: 'User Two',
      };

      mockAuth.mockResolvedValue(user2Session as any);
      mockUsersCollection.findOne.mockResolvedValue(user2);

      const request2 = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          place_id: placeId,
          content: 'Comment from User 2',
          rating: 4,
        }),
      });

      const response2 = await POST(request2);
      expect(response2.status).toBe(200);

      // Fetch all comments
      const mockComments = [
        {
          _id: new ObjectId(comment1Id),
          place_id: placeId,
          user_id: user1Id,
          content: 'Comment from User 1',
          rating: 5,
          edited: false,
          edited_at: null,
          created_at: new Date('2024-01-01'),
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
        {
          _id: new ObjectId(comment2Id),
          place_id: placeId,
          user_id: user2Id,
          content: 'Comment from User 2',
          rating: 4,
          edited: false,
          edited_at: null,
          created_at: new Date('2024-01-02'),
          likes: 0,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockComments),
      };

      mockCommentsCollection.find.mockReturnValue(mockFind);
      mockUsersCollection.findOne
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      const getRequest = new NextRequest(`http://localhost:3000/api/comments?place_id=${placeId}&sort_by=time`);
      const getResponse = await GET(getRequest);
      const comments = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(comments.length).toBe(2);
      expect(comments[0].content).toBe('Comment from User 1');
      expect(comments[1].content).toBe('Comment from User 2');
    });

    it('should handle users liking each other comments', async () => {
      const commentId = '507f1f77bcf86cd799439013';

      // User 1 likes User 2's comment
      const user1Session = {
        user: {
          email: 'user1@example.com',
          name: 'User One',
        },
      };

      const user1 = {
        _id: user1Id,
        email: 'user1@example.com',
      };

      const mockComment = {
        _id: new ObjectId(commentId),
        place_id: placeId,
        user_id: user2Id, // Comment by User 2
        content: 'Comment by User 2',
        likes: 0,
        dislikes: 0,
        user_likes: [],
        user_dislikes: [],
      };

      mockAuth.mockResolvedValue(user1Session as any);
      mockUsersCollection.findOne.mockResolvedValue(user1);
      mockCommentsCollection.findOne
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce({
          ...mockComment,
          likes: 1,
          user_likes: [user1Id],
        });

      const likeRequest = new NextRequest(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const likeResponse = await POST_LIKE(likeRequest, { params: { id: commentId } });
      expect(likeResponse.status).toBe(200);
      const likeData = await likeResponse.json();
      expect(likeData.likes).toBe(1);
      expect(likeData.user_liked).toBe(true);
    });
  });

  describe('Sorting After Operations', () => {
    it('should maintain correct sort order after likes change', async () => {
      const comment1Id = '507f1f77bcf86cd799439013';
      const comment2Id = '507f1f77bcf86cd799439014';

      // Initially comment1 has more likes
      const mockComments = [
        {
          _id: new ObjectId(comment1Id),
          place_id: placeId,
          user_id: user1Id,
          content: 'Comment 1',
          created_at: new Date('2024-01-01'),
          likes: 10,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
        {
          _id: new ObjectId(comment2Id),
          place_id: placeId,
          user_id: user2Id,
          content: 'Comment 2',
          created_at: new Date('2024-01-02'),
          likes: 5,
          dislikes: 0,
          user_likes: [],
          user_dislikes: [],
        },
      ];

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockComments),
      };

      mockCommentsCollection.find.mockReturnValue(mockFind);
      mockUsersCollection.findOne
        .mockResolvedValueOnce({ _id: user1Id, name: 'User 1' })
        .mockResolvedValueOnce({ _id: user2Id, name: 'User 2' });

      // Fetch sorted by likes
      const getRequest = new NextRequest(`http://localhost:3000/api/comments?place_id=${placeId}&sort_by=likes`);
      const getResponse = await GET(getRequest);
      const comments = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(comments.length).toBe(2);
      expect(comments[0].likes).toBe(10); // Comment 1 first (more likes)
      expect(comments[1].likes).toBe(5); // Comment 2 second
    });
  });
});

