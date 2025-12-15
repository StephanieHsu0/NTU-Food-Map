import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      session: session ? {
        user: {
          id: (session.user as any)?.id,
          name: session.user?.name,
          email: session.user?.email,
        },
      } : null,
      env: {
        hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasLineId: !!process.env.LINE_CHANNEL_ID,
        hasLineSecret: !!process.env.LINE_CHANNEL_SECRET,
        hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
        hasMongoUri: !!process.env.MONGODB_URI,
      },
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
      },
      { status: 500 }
    );
  }
}
