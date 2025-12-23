import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const favoritesCollection = db.collection('favorites');
    const favorites = await favoritesCollection
      .find({ user_id: user._id })
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json(
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
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { place_id, note } = body;

    if (!place_id) {
      return NextResponse.json(
        { error: 'place_id is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const favoritesCollection = db.collection('favorites');

    // Check if already favorited
    const existing = await favoritesCollection.findOne({
      user_id: user._id,
      place_id,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already favorited' },
        { status: 400 }
      );
    }

    const newFavorite = {
      user_id: user._id,
      place_id,
      note: note || null,
      created_at: new Date(),
    };

    const result = await favoritesCollection.insertOne(newFavorite);

    return NextResponse.json({
      id: result.insertedId.toString(),
      user_id: newFavorite.user_id.toString(),
      place_id: newFavorite.place_id,
      note: newFavorite.note,
      created_at: newFavorite.created_at,
    });
  } catch (error) {
    console.error('Error creating favorite:', error);
    return NextResponse.json(
      { error: 'Failed to create favorite' },
      { status: 500 }
    );
  }
}


