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

const lineClientId = process.env.AUTH_LINE_ID || process.env.LINE_CHANNEL_ID || process.env.AUTH_LINE_CHANNEL_ID;
const lineClientSecret = process.env.AUTH_LINE_SECRET || process.env.LINE_CHANNEL_SECRET || process.env.AUTH_LINE_CHANNEL_SECRET;

// Add Line provider with explicit endpoints and profile mapping to ensure pictureUrl is captured
if (lineClientId && lineClientSecret) {
  try {
    providers.push(
      Line({
        clientId: lineClientId,
        clientSecret: lineClientSecret,
        authorization: {
          url: 'https://access.line.me/oauth2/v2.1/authorize',
          params: {
            scope: 'profile openid email',
            response_type: 'code',
          },
        },
        token: 'https://api.line.me/oauth2/v2.1/token',
        userinfo: 'https://api.line.me/v2/profile',
        checks: ['state'],
        async profile(profile: any) {
          // Log minimal info for debugging cross-account issues; avoid tokens
          console.log('[LINE] profile received', {
            userId: profile?.userId,
            sub: profile?.sub,
            displayName: profile?.displayName,
            hasPicture: !!profile?.pictureUrl,
            allKeys: Object.keys(profile || {}),
          });
          // CRITICAL: Use userId as the unique identifier for LINE accounts
          // NextAuth v5 will use profile.id as providerAccountId in the account record
          // This must be unique per LINE user to prevent account mixing
          const lineUserId = profile?.userId || profile?.sub;
          if (!lineUserId) {
            console.error('[LINE] profile missing userId and sub!', profile);
            throw new Error('LINE profile missing user identifier');
          }
          return {
            id: lineUserId, // This becomes providerAccountId - MUST be unique per user
            name: profile.displayName,
            email: null, // Line doesn't provide email by default
            image: profile.pictureUrl || null,
          };
        },
      } as any)
    );
  } catch (error) {
    console.error('❌ Failed to add Line provider:', error);
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
    async signIn({ user, account, profile }) {
      if (!account) return true;

      const provider = account.provider;
      // NextAuth v5 may store providerAccountId in different fields
      // Try account.providerAccountId first, then account.sub, then user.id
      const providerAccountId = (account as any).providerAccountId 
        || (account as any).sub 
        || (profile as any)?.userId 
        || user?.id;

      console.log('[NextAuth.signIn] incoming account', {
        provider,
        providerAccountId,
        userId: user?.id,
        accountKeys: Object.keys(account),
        accountSub: (account as any).sub,
        profileUserId: (profile as any)?.userId,
        accountProviderAccountId: (account as any).providerAccountId,
      });

      if (!providerAccountId) {
        console.error('[NextAuth.signIn] missing providerAccountId', { 
          provider,
          account: Object.keys(account),
          profile: profile ? Object.keys(profile) : null,
        });
        return false;
      }

      try {
        const db = await connectToDatabase();
        const accountsCollection = db.collection('accounts');
        const existingAccount = await accountsCollection.findOne({
          provider,
          providerAccountId,
        });

        if (existingAccount) {
          const existingUserId = typeof existingAccount.userId === 'string'
            ? existingAccount.userId
            : existingAccount.userId.toHexString();
          const incomingUserId = (user as any)?.id;

          console.log('[NextAuth.signIn] found existing account', {
            provider,
            providerAccountId,
            existingUserId,
            incomingUserId,
          });

          if (incomingUserId && existingUserId !== incomingUserId) {
            console.error('[NextAuth.signIn] providerAccountId linked to another user. Blocking sign-in.', {
              provider,
              providerAccountId,
              existingUserId,
              incomingUserId,
            });
            return false;
          }

          // If user exists but name/image missing, backfill from profile
          const usersCollection = db.collection('users');
          const userIdObj = typeof existingAccount.userId === 'string'
            ? new ObjectId(existingAccount.userId)
            : existingAccount.userId;
          const existingUser = await usersCollection.findOne({ _id: userIdObj });
          const displayName = (profile as any)?.name || (profile as any)?.displayName || existingUser?.name;
          const picture =
            (profile as any)?.picture ||
            (profile as any)?.pictureUrl ||
            existingUser?.image;
          const updateData: any = { updatedAt: new Date() };
          let needUpdate = false;
          if (!existingUser?.name && displayName) {
            updateData.name = displayName;
            needUpdate = true;
          }
          if (!existingUser?.image && picture) {
            updateData.image = picture;
            needUpdate = true;
          }
          if (needUpdate) {
            await usersCollection.updateOne({ _id: userIdObj }, { $set: updateData });
            console.log('[NextAuth.signIn] backfilled user profile from LINE', {
              providerAccountId,
              updatedName: updateData.name,
              updatedImage: !!updateData.image,
            });
          }
        } else {
          console.log('[NextAuth.signIn] no existing account, proceed to link', {
            provider,
            providerAccountId,
            incomingUserId: (user as any)?.id,
          });
        }
      } catch (error) {
        console.error('[NextAuth.signIn] error while checking account linkage', error);
        // Allow sign-in to avoid locking users out due to transient DB errors
        return true;
      }

      return true;
    },
    async session({ session, user }) {
      // With database strategy, user is available directly
      if (session.user && user) {
        (session.user as any).id = user.id;
        
        try {
          const db = await connectToDatabase();
          
          // Fetch provider from accounts collection
          const accountsCollection = db.collection('accounts');
          const account = await accountsCollection.findOne({ userId: new ObjectId(user.id) });
          (session.user as any).provider = account?.provider || null;

          // Always refresh user fields from DB to ensure latest name/image
          const usersCollection = db.collection('users');
          const freshUser = await usersCollection.findOne({ _id: new ObjectId(user.id) });

          const safeName = freshUser?.name || user.name || user.email || user.id;
          session.user.name = safeName || null;
          if (freshUser?.email || user.email) {
            session.user.email = freshUser?.email || user.email;
          }
          // Keep image out of session to avoid large headers; UI can fetch via profile API
          session.user.image = null;
        } catch (error) {
          console.error('Error enriching session:', error);
          // Fallbacks to avoid breaking session
          session.user.name = user.name || user.email || user.id;
          session.user.image = null;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/zh/auth/signin', // Default locale, will be handled by middleware
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
});

