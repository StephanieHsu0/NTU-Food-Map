import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('place_id');
    const sortBy = searchParams.get('sort_by') || 'time'; // 'time' or 'likes'

    if (!placeId) {
      return NextResponse.json(
        { error: 'place_id is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const commentsCollection = db.collection('comments');

    // Find comments for this place
    const query = { place_id: placeId };
    let sort: any = { created_at: -1 }; // Default: newest first

    if (sortBy === 'likes') {
      sort = { likes: -1, created_at: -1 }; // Sort by likes, then by time
    }

    const comments = await commentsCollection
      .find(query)
      .sort(sort)
      .toArray();

    // Populate user information
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
          user_likes: (comment.user_likes || []).map((id: any) => id.toString()),
          user_dislikes: (comment.user_dislikes || []).map((id: any) => id.toString()),
        };
      })
    );

    return NextResponse.json(commentsWithUsers);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
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
    const { place_id, content, rating } = body;

    if (!place_id || !content) {
      return NextResponse.json(
        { error: 'place_id and content are required' },
        { status: 400 }
      );
    }

    // Get user ID from session
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const commentsCollection = db.collection('comments');
    const newComment = {
      place_id,
      user_id: user._id,
      content,
      rating: rating || null,
      edited: false,
      edited_at: null,
      created_at: new Date(),
      likes: 0,
      dislikes: 0,
      user_likes: [],
      user_dislikes: [],
    };

    const result = await commentsCollection.insertOne(newComment);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...newComment,
      user_id: newComment.user_id.toString(),
      user_name: session.user.name || 'Unknown',
      user_avatar: session.user.image || null,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

