import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';

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
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User id missing in session' },
        { status: 400 }
      );
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user_id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current user' },
      { status: 500 }
    );
  }
}

