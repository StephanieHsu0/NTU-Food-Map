import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { Adapter } from 'next-auth/adapters';
import { MongoDBAdapter } from './mongodb-adapter';
import { connectToDatabase } from './db';
import { ObjectId } from 'mongodb';

// Helper function to decode JWT (id_token) without verification
// We only decode to check the 'sub' field, actual verification is done by NextAuth
// This is a best-effort check and should not block login if it fails
function decodeJWT(token: string): any {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Use base64 decoding that works in both Node.js and Edge Runtime
    // Replace URL-safe base64 characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    // Use atob in browser/Edge or Buffer in Node.js
    let decoded: string;
    if (typeof window !== 'undefined' && typeof atob !== 'undefined') {
      decoded = atob(padded);
    } else if (typeof Buffer !== 'undefined') {
      decoded = Buffer.from(padded, 'base64').toString('utf-8');
    } else {
      // Fallback: try to decode manually (basic implementation)
      return null;
    }
    return JSON.parse(decoded);
  } catch (error) {
    // Silently fail - this is a best-effort check
    return null;
  }
}

const providers: any[] = [];

// Google Provider 設定 (保持您原本的邏輯，稍微簡化)
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({
    authorization: {
      params: {
        scope: 'openid email profile',
        prompt: 'consent',
        access_type: 'offline',
      },
    },
    // Allow linking Google account to existing user with same verified email
    allowDangerousEmailAccountLinking: true,
  } as any));
}

// Line Provider 設定變數
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  throw new Error('❌ AUTH_SECRET is missing. Authentication cannot function securely.');
}

// 確保至少有一個 provider 被配置
if (providers.length === 0) {
  const errorMsg = '❌ No OAuth providers configured. At least one provider (Google or LINE) is required.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// 驗證配置完整性
console.log(`✅ [Auth Config] ${providers.length} provider(s) configured:`, providers.map((p: any) => p.id || p.name));

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: MongoDBAdapter() as Adapter,
  providers,
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    // 🔴 重點修正 3: 強化 signIn 邏輯，防止帳號混淆
    async signIn({ user, account, profile }) {
      // 基本驗證：account 和 user 必須存在
      if (!account || !user) {
        console.error('❌ [SignIn Security] Missing account or user object');
        return false;
      }

      // 驗證 provider 是否為允許的值
      if (!account.provider || account.provider !== 'google') {
        console.error('❌ [SignIn Security] Invalid provider:', account.provider);
        return false;
      }

      // 嚴格取得 providerAccountId - 這是唯一識別外部帳號的關鍵
      const providerAccountId = account.providerAccountId;

      // 如果抓不到 providerAccountId，直接拒絕登入
      if (!providerAccountId || typeof providerAccountId !== 'string' || providerAccountId.trim() === '') {
        console.error('❌ [SignIn Security] Missing or invalid providerAccountId. Login blocked.');
        return false;
      }

      // For Google only,允許登入（DB 檢查交由 adapter 處理）
      console.log(`🔐 [SignIn] Provider: ${account.provider}, ProviderAccountId: ${providerAccountId}`);
      return true;
    },
    async session({ session, user }) {
      // 🔴 安全檢查：確保 session 和 user 對象存在且有效
      if (!session || !session.user || !user || !user.id) {
        console.error('❌ [Session Security] Invalid session or user object');
        // 如果 session 無效，返回基本結構但保持類型兼容
        return session;
      }

      // 確保 user.id 是有效的字符串
      const userId = user.id.toString();
      if (!userId || userId.trim() === '') {
        console.error('❌ [Session Security] Invalid user.id');
        return session;
      }

      // 安全地設置 session 數據
      (session.user as any).id = userId;
      if (user.name) session.user.name = user.name;
      if (user.image) session.user.image = user.image;
      if (user.email) session.user.email = user.email;

      return session;
    },
  },
  pages: {
    signIn: '/zh/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
});



