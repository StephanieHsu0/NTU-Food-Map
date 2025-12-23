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
    
    // 🔴 修正：使用 session.user.id (ObjectId) 查詢
    const user = await usersCollection.findOne({ _id: new ObjectId((session.user as any).id) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Get user's comments
    const commentsCollection = db.collection('comments');
    const comments = await commentsCollection
      .find({ user_id: user._id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await commentsCollection.countDocuments({
      user_id: user._id,
    });

    // Get place information for each comment
    const placesCollection = db.collection('places');
    const { getPlaceDetailsFromGoogle } = await import('@/lib/googlePlacesServer');
    
    const commentsWithPlaces = await Promise.all(
      comments.map(async (comment) => {
        // First try to find in database
        let place = await placesCollection.findOne({
          id: comment.place_id,
        });

        // If not found in database and it looks like a Google Places ID, try Google Places API
        if (!place && (comment.place_id.startsWith('ChIJ') || comment.place_id.startsWith('ChlJ') || comment.place_id.length > 20)) {
          console.log(`Place ${comment.place_id} not found in database, trying Google Places API...`);
          const googlePlaceInfo = await getPlaceDetailsFromGoogle(comment.place_id);
          if (googlePlaceInfo) {
            // Use Google Places API data
            return {
              id: comment._id.toString(),
              place_id: comment.place_id,
              place_name_zh: googlePlaceInfo.name_zh,
              place_name_en: googlePlaceInfo.name_en,
              content: comment.content,
              rating: comment.rating || null,
              edited: comment.edited || false,
              edited_at: comment.edited_at || null,
              created_at: comment.created_at,
              likes: comment.likes || 0,
              dislikes: comment.dislikes || 0,
            };
          }
        }

        return {
          id: comment._id.toString(),
          place_id: comment.place_id,
          place_name_zh: place?.name_zh || null,
          place_name_en: place?.name_en || null,
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

    return NextResponse.json({
      comments: commentsWithPlaces,
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user comments' },
      { status: 500 }
    );
  }
}

