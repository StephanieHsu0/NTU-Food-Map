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
    const db = await connectToDatabase();
    const commentsCollection = db.collection('comments');
    const comment = await commentsCollection.findOne({
      _id: new ObjectId(params.id),
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Populate user information
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({
      _id: new ObjectId(comment.user_id),
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, rating } = body;

    const db = await connectToDatabase();
    const commentsCollection = db.collection('comments');
    const comment = await commentsCollection.findOne({
      _id: new ObjectId(params.id),
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });
    if (!user || comment.user_id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update comment
    const updateData: any = {
      content,
      edited: true,
      edited_at: new Date(),
    };
    if (rating !== undefined) {
      updateData.rating = rating;
    }

    await commentsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    const updatedComment = await commentsCollection.findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json({
      id: updatedComment!._id.toString(),
      place_id: updatedComment!.place_id,
      user_id: updatedComment!.user_id.toString(),
      user_name: session.user.name || 'Unknown',
      user_avatar: session.user.image || null,
      content: updatedComment!.content,
      rating: updatedComment!.rating || null,
      edited: updatedComment!.edited || false,
      edited_at: updatedComment!.edited_at || null,
      created_at: updatedComment!.created_at,
      likes: updatedComment!.likes || 0,
      dislikes: updatedComment!.dislikes || 0,
      user_likes: (updatedComment!.user_likes || []).map((id: any) => id.toString()),
      user_dislikes: (updatedComment!.user_dislikes || []).map((id: any) => id.toString()),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    const commentsCollection = db.collection('comments');
    const comment = await commentsCollection.findOne({
      _id: new ObjectId(params.id),
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });
    if (!user || comment.user_id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await commentsCollection.deleteOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}


