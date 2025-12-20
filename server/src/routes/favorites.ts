import express, { Request, Response } from 'express';
import connectToDatabase from '../db';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Note: These routes are for Express server compatibility
// The main implementation uses Next.js API routes in client/app/api/favorites

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const db = await connectToDatabase();
    const favoritesCollection = db.collection('favorites');
    const favorites = await favoritesCollection
      .find({ user_id: new ObjectId(userId) })
      .sort({ created_at: -1 })
      .toArray();

    res.json(
      favorites.map((fav) => ({
        id: fav._id.toString(),
        user_id: fav.user_id.toString(),
        place_id: fav.place_id,
        note: fav.note || null,
        created_at: fav.created_at,
      }))
    );
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

export default router;

