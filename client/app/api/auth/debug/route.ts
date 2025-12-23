import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const envCheck = {
    runtimeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'not set',
    hasVercel: !!process.env.VERCEL,

    // Google
    hasAUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    hasAUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    hasGOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientIdPreview: (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID)
      ? `${(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID)?.substring(0, 20)}...`
      : 'not set',

    // LINE
    hasAUTH_LINE_ID: !!process.env.AUTH_LINE_ID,
    hasLINE_CHANNEL_ID: !!process.env.LINE_CHANNEL_ID,
    hasAUTH_LINE_SECRET: !!process.env.AUTH_LINE_SECRET,
    hasLINE_CHANNEL_SECRET: !!process.env.LINE_CHANNEL_SECRET,
    lineClientIdPreview: (process.env.AUTH_LINE_ID || process.env.LINE_CHANNEL_ID)
      ? `${(process.env.AUTH_LINE_ID || process.env.LINE_CHANNEL_ID)?.substring(0, 20)}...`
      : 'not set',

    // Core auth
    hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    authSecretLength: (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').length,
    hasAuthUrl: !!(process.env.AUTH_URL || process.env.NEXTAUTH_URL),
    authUrl: process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'not set',

    // DB
    hasMongoUri: !!process.env.MONGODB_URI,
    dbName: process.env.DB_NAME || 'not set',
  };

  return NextResponse.json(envCheck);
}


