import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Line from 'next-auth/providers/line';
import type { Adapter } from 'next-auth/adapters';
import { MongoDBAdapter } from './mongodb-adapter';
import { connectToDatabase } from './db';
import { ObjectId } from 'mongodb';

// NextAuth v5 automatically detects environment variables with AUTH_ prefix
// For Google: AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET
// For Line: AUTH_LINE_ID and AUTH_LINE_SECRET
// If you use the correct naming, NextAuth will auto-detect them
// and you can call the provider without parameters

const providers: any[] = [];

// Add Google provider - NextAuth v5 will auto-detect AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET
// According to NextAuth v5 docs, if you use AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET,
// you can call Google() without parameters and it will auto-detect
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  // Use auto-detection - NextAuth will automatically read AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET
  // TypeScript types may not reflect this yet, so we use type assertion
  providers.push(Google({
    // Limit authorization parameters to prevent HTTP 431 errors
    authorization: {
      params: {
        // Request minimal scopes to reduce response size
        scope: 'openid email profile',
        // Prevent prompt parameter from being too long
        prompt: 'consent',
        // Limit access type
        access_type: 'offline',
      },
    },
  } as any));
} else if (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) {
  // Fallback: explicitly pass credentials for backward compatibility
  if (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            scope: 'openid email profile',
            prompt: 'consent',
            access_type: 'offline',
          },
        },
      })
    );
  } else {
    console.warn('⚠️ Google OAuth: AUTH_GOOGLE_SECRET is missing');
  }
} else {
  console.warn('⚠️ Skipping Google provider - AUTH_GOOGLE_ID not set');
}

// Add Line provider - NextAuth v5 will auto-detect AUTH_LINE_ID and AUTH_LINE_SECRET
if (process.env.AUTH_LINE_ID && process.env.AUTH_LINE_SECRET) {
  // Use auto-detection - NextAuth will automatically read AUTH_LINE_ID and AUTH_LINE_SECRET
  // TypeScript types may not reflect this yet, so we use type assertion
  try {
    providers.push(Line({} as any));
  } catch (error) {
    console.error('❌ Failed to add Line provider:', error);
  }
} else if (process.env.AUTH_LINE_ID || process.env.LINE_CHANNEL_ID || process.env.AUTH_LINE_CHANNEL_ID) {
  // Fallback: explicitly pass credentials for backward compatibility
  if (process.env.AUTH_LINE_SECRET || process.env.LINE_CHANNEL_SECRET || process.env.AUTH_LINE_CHANNEL_SECRET) {
    try {
      providers.push(
        Line({
          clientId: process.env.AUTH_LINE_ID || process.env.LINE_CHANNEL_ID || process.env.AUTH_LINE_CHANNEL_ID,
          clientSecret: process.env.AUTH_LINE_SECRET || process.env.LINE_CHANNEL_SECRET || process.env.AUTH_LINE_CHANNEL_SECRET,
        })
      );
    } catch (error) {
      console.error('❌ Failed to add Line provider:', error);
    }
  } else {
    console.warn('⚠️ Line OAuth: AUTH_LINE_SECRET is missing');
  }
} else {
  console.warn('⚠️ Skipping Line provider - AUTH_LINE_ID not set');
}

if (providers.length === 0) {
  console.error('❌ No OAuth providers configured! Please set at least one provider credentials.');
}

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.error('❌ AUTH_SECRET not set. Please set AUTH_SECRET or NEXTAUTH_SECRET environment variable.');
  console.error('   Generate one with: openssl rand -base64 32');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required for Vercel deployment, or set AUTH_TRUST_HOST=true
  // secret is auto-detected from AUTH_SECRET or NEXTAUTH_SECRET env var
  adapter: MongoDBAdapter() as Adapter,
  providers,
  session: {
    strategy: 'database', // Use database session instead of JWT to prevent HTTP 431
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Shorter maxAge to reduce cookie accumulation
        maxAge: 7 * 24 * 60 * 60, // 7 days
      },
    },
    // Optimize callback URL cookie to prevent HTTP 431
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60, // 1 hour - short lived
      },
    },
    // Optimize CSRF token cookie
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24 hours
      },
    },
  },
  callbacks: {
    async session({ session, user }) {
      // With database strategy, user is available directly
      if (session.user && user) {
        (session.user as any).id = user.id;
        
        // Fetch provider from accounts collection
        try {
          const db = await connectToDatabase();
          const accountsCollection = db.collection('accounts');
          const account = await accountsCollection.findOne({ userId: new ObjectId(user.id) });
          (session.user as any).provider = account?.provider || null;
        } catch (error) {
          console.error('Error fetching provider in session callback:', error);
        }
        
        // Use user data from database (already fetched by adapter)
        // DO NOT set image in session - it can be very long
        session.user.name = user.name || null;
        if (user.email) {
          session.user.email = user.email;
        }
        session.user.image = null; // Always null to prevent HTTP 431
      }
      return session;
    },
  },
  pages: {
    signIn: '/zh/auth/signin', // Default locale, will be handled by middleware
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
});

