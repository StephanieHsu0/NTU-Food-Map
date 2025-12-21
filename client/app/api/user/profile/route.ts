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
    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get comment count
    const commentsCollection = db.collection('comments');
    const commentCount = await commentsCollection.countDocuments({
      user_id: user._id,
    });

    // Get favorite count
    const favoritesCollection = db.collection('favorites');
    const favoriteCount = await favoritesCollection.countDocuments({
      user_id: user._id,
    });

    // Get user's provider information
    const accountsCollection = db.collection('accounts');
    const account = await accountsCollection.findOne({ userId: user._id });
    const provider = account?.provider || null;

    return NextResponse.json({
      user_id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || null,
      provider: provider,
      comment_count: commentCount,
      favorite_count: favoriteCount,
      created_at: user.createdAt || null,
      updated_at: user.updatedAt || null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, image } = body;

    // Validate input
    if (name && (typeof name !== 'string' || name.trim().length === 0 || name.length > 50)) {
      return NextResponse.json(
        { error: 'Invalid name. Name must be between 1 and 50 characters.' },
        { status: 400 }
      );
    }

    if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check user's provider information
    const accountsCollection = db.collection('accounts');
    const account = await accountsCollection.findOne({ userId: user._id });
    const provider = account?.provider;

    // If user is OAuth account (google or line), check if email is being changed
    if (email !== undefined && provider && (provider === 'google' || provider === 'line')) {
      // Only reject if email is actually being changed
      if (email.trim() !== user.email) {
        return NextResponse.json(
          { error: 'Email cannot be changed for OAuth accounts' },
          { status: 400 }
        );
      }
      // If email is the same, just ignore it (don't update)
      // This allows OAuth users to update name/image without issues
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (email !== undefined && !provider) {
      // Only non-OAuth accounts can modify email
      // Check if email is already taken by another user
      const existingUser = await usersCollection.findOne({ 
        email: email.trim(),
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
      
      updateData.email = email.trim();
    }

    if (image !== undefined) {
      updateData.image = image;
    }

    // Update user
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: updateData }
    );

    // Fetch updated user
    const updatedUser = await usersCollection.findOne({ _id: user._id });

    // Get counts
    const commentsCollection = db.collection('comments');
    const commentCount = await commentsCollection.countDocuments({
      user_id: user._id,
    });

    const favoritesCollection = db.collection('favorites');
    const favoriteCount = await favoritesCollection.countDocuments({
      user_id: user._id,
    });

    // Get updated provider info
    const updatedAccount = await accountsCollection.findOne({ userId: user._id });

    return NextResponse.json({
      user_id: updatedUser!._id.toString(),
      name: updatedUser!.name,
      email: updatedUser!.email,
      image: updatedUser!.image || null,
      provider: updatedAccount?.provider || null,
      comment_count: commentCount,
      favorite_count: favoriteCount,
      created_at: updatedUser!.createdAt || null,
      updated_at: updatedUser!.updatedAt || null,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

