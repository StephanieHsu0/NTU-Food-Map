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
    // 🔴 安全檢查：驗證 ObjectId 格式
    if (!params.id || !/^[a-f\d]{24}$/i.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid comment ID format' },
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
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });
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

    // Check if user already disliked
    const alreadyDisliked = userDislikes.includes(userIdStr);
    const alreadyLiked = userLikes.includes(userIdStr);

    let updateData: any = {};

    if (alreadyDisliked) {
      // Remove dislike
      updateData = {
        $pull: { user_dislikes: userId },
        $inc: { dislikes: -1 },
      };
    } else {
      // Add dislike, remove like if exists
      updateData = {
        $addToSet: { user_dislikes: userId },
        $inc: { dislikes: 1 },
      };
      if (alreadyLiked) {
        updateData.$pull = { user_likes: userId };
        updateData.$inc.likes = -1;
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
      user_liked: false,
      user_disliked: !alreadyDisliked,
    });
  } catch (error) {
    console.error('Error disliking comment:', error);
    return NextResponse.json(
      { error: 'Failed to dislike comment' },
      { status: 500 }
    );
  }
}


