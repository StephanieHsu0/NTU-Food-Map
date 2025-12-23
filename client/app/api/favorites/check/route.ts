import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ favorited: false, favorite_id: null });
    }

    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return NextResponse.json(
        { error: 'place_id is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });

    if (!user) {
      return NextResponse.json({ favorited: false, favorite_id: null });
    }

    const favoritesCollection = db.collection('favorites');
    const favorite = await favoritesCollection.findOne({
      user_id: user._id,
      place_id: placeId,
    });

    if (!favorite) {
      return NextResponse.json({ favorited: false, favorite_id: null });
    }

    return NextResponse.json({
      favorited: true,
      favorite_id: favorite._id.toString(),
      note: favorite.note || null,
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite' },
      { status: 500 }
    );
  }
}


