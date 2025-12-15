import express, { Request, Response } from 'express';
import connectToDatabase from '../db';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Note: These routes are for Express server compatibility
// The main implementation uses Next.js API routes in client/app/api/comments

router.get('/', async (req: Request, res: Response) => {
  try {
    const placeId = req.query.place_id as string;
    const sortBy = (req.query.sort_by as string) || 'time';

    if (!placeId) {
      return res.status(400).json({ error: 'place_id is required' });
    }

    const db = await connectToDatabase();
    const commentsCollection = db.collection('comments');

    const query = { place_id: placeId };
    let sort: any = { created_at: -1 };

    if (sortBy === 'likes') {
      sort = { likes: -1, created_at: -1 };
    }

    const comments = await commentsCollection.find(query).sort(sort).toArray();

    const usersCollection = db.collection('users');
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await usersCollection.findOne({
          _id: new ObjectId(comment.user_id),
        });
        return {
          id: comment._id.toString(),
          place_id: comment.place_id,
          user_id: comment.user_id.toString(),
          user_name: user?.name || 'Unknown',
          user_avatar: user?.image || null,
          content: comment.content,
          rating: comment.rating || null,
          edited: comment.edited || false,
          edited_at: comment.edited_at || null,
          created_at: comment.created_at,
          likes: comment.likes || 0,
          dislikes: comment.dislikes || 0,
        };
      })
    );

    res.json(commentsWithUsers);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

export default router;
