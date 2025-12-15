import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user._id;
    const userLikes = (comment.user_likes || []).map((id: any) => id.toString());
    const userDislikes = (comment.user_dislikes || []).map((id: any) => id.toString());
    const userIdStr = userId.toString();

    // Check if user already liked
    const alreadyLiked = userLikes.includes(userIdStr);
    const alreadyDisliked = userDislikes.includes(userIdStr);

    let updateData: any = {};

    if (alreadyLiked) {
      // Remove like
      updateData = {
        $pull: { user_likes: userId },
        $inc: { likes: -1 },
      };
    } else {
      // Add like, remove dislike if exists
      updateData = {
        $addToSet: { user_likes: userId },
        $inc: { likes: 1 },
      };
      if (alreadyDisliked) {
        updateData.$pull = { user_dislikes: userId };
        updateData.$inc.dislikes = -1;
      }
    }

    await commentsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      updateData
    );

    const updatedComment = await commentsCollection.findOne({
      _id: new ObjectId(params.id),
    });

    return NextResponse.json({
      likes: updatedComment!.likes || 0,
      dislikes: updatedComment!.dislikes || 0,
      user_liked: !alreadyLiked,
      user_disliked: false,
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Failed to like comment' },
      { status: 500 }
    );
  }
}
