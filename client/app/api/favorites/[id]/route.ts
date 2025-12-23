import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔴 安全檢查：驗證 ObjectId 格式
    if (!params.id || !/^[a-f\d]{24}$/i.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid favorite ID format' },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    const favoritesCollection = db.collection('favorites');
    const favorite = await favoritesCollection.findOne({
      _id: new ObjectId(params.id),
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    // Check if user owns this favorite
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });
    if (!user || favorite.user_id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: favorite._id.toString(),
      user_id: favorite.user_id.toString(),
      place_id: favorite.place_id,
      note: favorite.note || null,
      created_at: favorite.created_at,
    });
  } catch (error) {
    console.error('Error fetching favorite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔴 安全檢查：驗證 ObjectId 格式
    if (!params.id || !/^[a-f\d]{24}$/i.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid favorite ID format' },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { note } = body;

    const db = await connectToDatabase();
    const favoritesCollection = db.collection('favorites');
    const favorite = await favoritesCollection.findOne({
      _id: new ObjectId(params.id),
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    // Check if user owns this favorite
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });
    if (!user || favorite.user_id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await favoritesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { note: note || null } }
    );

    const updatedFavorite = await favoritesCollection.findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json({
      id: updatedFavorite!._id.toString(),
      user_id: updatedFavorite!.user_id.toString(),
      place_id: updatedFavorite!.place_id,
      note: updatedFavorite!.note || null,
      created_at: updatedFavorite!.created_at,
    });
  } catch (error) {
    console.error('Error updating favorite:', error);
    return NextResponse.json(
      { error: 'Failed to update favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔴 安全檢查：驗證 ObjectId 格式
    if (!params.id || !/^[a-f\d]{24}$/i.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid favorite ID format' },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    const favoritesCollection = db.collection('favorites');
    const favorite = await favoritesCollection.findOne({
      _id: new ObjectId(params.id),
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    // Check if user owns this favorite
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });
    if (!user || favorite.user_id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await favoritesCollection.deleteOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    );
  }
}


