import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY;
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing',
    keyStartsWith: apiKey ? apiKey.substring(0, 4) : 'N/A',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}


