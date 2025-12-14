import { NextResponse } from 'next/server';

// Force dynamic rendering for health check endpoint
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'NTU Food Map API is running' 
  });
}

