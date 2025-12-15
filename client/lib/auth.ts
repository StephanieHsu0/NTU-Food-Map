import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import LineProvider from './providers/line';
import type { Adapter } from '@auth/core/adapters';
import { MongoDBAdapter } from './mongodb-adapter';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required for Vercel deployment
  adapter: MongoDBAdapter() as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    LineProvider({
      clientId: process.env.LINE_CHANNEL_ID || '',
      clientSecret: process.env.LINE_CHANNEL_SECRET || '',
    }) as any,
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).provider = token.provider as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/zh/auth/signin', // Default locale, will be handled by middleware
  },
});
