import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const envCheck = {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasLineChannelId: !!process.env.LINE_CHANNEL_ID,
    hasLineChannelSecret: !!process.env.LINE_CHANNEL_SECRET,
    hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    hasMongoUri: !!process.env.MONGODB_URI,
    authSecretLength: (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').length,
    googleClientIdPreview: process.env.GOOGLE_CLIENT_ID
      ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`
      : 'not set',
  };

  return NextResponse.json(envCheck);
}

