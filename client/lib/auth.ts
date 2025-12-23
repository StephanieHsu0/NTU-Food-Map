import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Line from '@auth/core/providers/line'; // 使用官方 LINE provider
import type { Adapter } from 'next-auth/adapters';
import { MongoDBAdapter } from './mongodb-adapter';
import { connectToDatabase } from './db';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// 在構建時也加載環境變數（Next.js 會自動加載，但這裡確保也能從父目錄加載）
// 嘗試從多個位置加載 .env 文件
if (typeof window === 'undefined') {
  try {
    // 嘗試從多個位置加載 .env 文件（按優先順序）
    const envPaths = [
      path.resolve(process.cwd(), '.env.local'),      // Next.js 優先使用的文件
      path.resolve(process.cwd(), '.env'),            // Next.js 也會加載
      path.resolve(process.cwd(), '../../.env'),     // 從 client 目錄向上到根目錄
      path.resolve(process.cwd(), '../.env'),         // 從當前目錄向上
    ];
    
    // 按順序嘗試加載，不覆蓋已存在的環境變數
    for (const envPath of envPaths) {
      try {
        dotenv.config({ path: envPath, override: false });
      } catch (e) {
        // 忽略文件不存在的錯誤
      }
    }
  } catch (e) {
    // 如果加載失敗，繼續執行（Next.js 可能已經加載了環境變數）
  }
}

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

// Google Provider 設定 (同時支援 AUTH_GOOGLE_* 與 GOOGLE_CLIENT_* 命名)
const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 [Auth Config] Google env check:', {
    hasAUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    hasAUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    hasGOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientIdPreview: googleClientId ? `${googleClientId.substring(0, 6)}...` : 'NOT SET',
  });
}

if (googleClientId && googleClientSecret) {
  providers.push(Google({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    authorization: {
      params: {
        scope: 'openid email profile',
        prompt: 'consent',
        access_type: 'offline',
      },
    },
  } as any));
} else if (process.env.NODE_ENV === 'development') {
  // 只在開發模式下顯示警告，構建時不顯示（環境變數可能在部署時才設置）
  console.warn('⚠️ Skipping Google provider - AUTH_GOOGLE_ID/SECRET or GOOGLE_CLIENT_ID/SECRET not set');
}

// Line Provider 設定變數
const lineClientId = process.env.AUTH_LINE_ID || process.env.LINE_CHANNEL_ID;
const lineClientSecret = process.env.AUTH_LINE_SECRET || process.env.LINE_CHANNEL_SECRET;

// Debug: Log environment variable status (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 [Auth Config] Environment variables check:', {
    hasAUTH_LINE_ID: !!process.env.AUTH_LINE_ID,
    hasLINE_CHANNEL_ID: !!process.env.LINE_CHANNEL_ID,
    hasAUTH_LINE_SECRET: !!process.env.AUTH_LINE_SECRET,
    hasLINE_CHANNEL_SECRET: !!process.env.LINE_CHANNEL_SECRET,
    lineClientId: lineClientId ? `${lineClientId.substring(0, 4)}...` : 'NOT SET',
    hasLineSecret: !!lineClientSecret,
    hasAUTH_SECRET: !!process.env.AUTH_SECRET,
    hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  });
}

// 🔴 重點修正 1: Line Provider 設定
// 使用自定義的 LINE provider（已包含 profile callback 和錯誤處理）
if (lineClientId && lineClientSecret) {
  try {
    providers.push(
      Line({
        clientId: lineClientId,
        clientSecret: lineClientSecret,
        // Force consent each time so users can切換 LINE 帳號
        authorization: {
          params: {
            prompt: 'consent',
            max_age: 0, // ensure re-auth instead of silently reusing prior login
          },
        },
      } as any)
    );
    console.log('✅ [Auth Config] LINE provider configured successfully');
  } catch (lineProviderError) {
    console.error('❌ [Auth Config] Failed to configure LINE provider:', lineProviderError);
    // 不阻止應用啟動，但記錄錯誤
  }
} else if (process.env.NODE_ENV === 'development') {
  // 只在開發模式下顯示警告，構建時不顯示（環境變數可能在部署時才設置）
  console.warn('⚠️ Skipping Line provider - AUTH_LINE_ID or AUTH_LINE_SECRET not set');
}

// 在構建時允許缺少 AUTH_SECRET，NextAuth 會在運行時檢查
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'development') {
  // 只在開發模式下顯示警告，構建時不顯示（環境變數可能在部署時才設置）
  console.warn('⚠️ AUTH_SECRET is missing. Authentication may not function securely in production.');
}

// 確保至少有一個 provider 被配置（構建時允許為空，運行時會檢查）
if (providers.length === 0 && process.env.NODE_ENV === 'development') {
  // 只在開發模式下顯示警告，構建時不顯示（環境變數可能在部署時才設置）
  console.warn('⚠️ No OAuth providers configured. At least one provider (Google or LINE) is required.');
}

// 驗證配置完整性（只在開發模式或構建時有配置時顯示）
if (process.env.NODE_ENV === 'development' || providers.length > 0) {
  console.log(`✅ [Auth Config] ${providers.length} provider(s) configured:`, providers.map((p: any) => p.id || p.name));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: MongoDBAdapter() as Adapter,
  providers,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'temp-secret-for-build'),
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
      if (!account.provider || !['google', 'line'].includes(account.provider)) {
        console.error('❌ [SignIn Security] Invalid provider:', account.provider);
        return false;
      }

      // 嚴格取得 providerAccountId - 這是唯一識別外部帳號的關鍵
      const providerAccountId = account.providerAccountId;
      const providerAccountIdPreview = providerAccountId ? `${providerAccountId.substring(0, 12)}...` : 'N/A';

      // 如果抓不到 providerAccountId，直接拒絕登入
      if (!providerAccountId || typeof providerAccountId !== 'string' || providerAccountId.trim() === '') {
        console.error('❌ [SignIn Security] Missing or invalid providerAccountId. Login blocked.');
        return false;
      }

      // 🔴 關鍵安全檢查：驗證 id_token 與 providerAccountId 的一致性
      // 防止 id_token 被重用或混淆
      // 注意：這是 best-effort 檢查，如果 id_token 不存在或無法解碼，不會阻止登入
      // 因為 NextAuth 已經驗證了 OAuth 流程的正確性
      // LINE provider 基於 OpenID Connect，profile 包含 'sub' 字段（不是 'userId'）
      if (account.provider === 'line' && (account as any).id_token) {
        try {
          const idTokenPayload = decodeJWT((account as any).id_token);
          if (idTokenPayload && idTokenPayload.sub) {
            // LINE id_token 中的 'sub' 應該與 providerAccountId 一致
            const idTokenSub = idTokenPayload.sub;
            const profileSub = (profile as any)?.sub; // LINE OpenID Connect 使用 'sub' 而不是 'userId'
            
            // 驗證 id_token 的 sub 與 providerAccountId 一致
            // 只有在兩者都存在且不匹配時才阻止
            if (idTokenSub && providerAccountId && idTokenSub !== providerAccountId) {
              console.error('⛔ [Security Alert] CRITICAL: id_token sub mismatch!', {
                providerAccountId: providerAccountId,
                idTokenSub: idTokenSub,
                profileSub: profileSub,
              });
              return false;
            }

            // 驗證 id_token 的 sub 與 profile.sub 一致（如果 profile 有 sub）
            if (profileSub && idTokenSub && idTokenSub !== profileSub) {
              console.error('⛔ [Security Alert] CRITICAL: id_token sub does not match profile.sub!', {
                idTokenSub: idTokenSub,
                profileSub: profileSub,
                providerAccountId: providerAccountId,
              });
              return false;
            }

            console.log('✅ [SignIn Security] id_token verified. Sub matches providerAccountId:', idTokenSub);
          } else {
            // id_token 無法解碼或沒有 sub，這是可接受的（可能是格式問題或 NextAuth 已驗證）
            // 繼續使用 providerAccountId 進行驗證
            console.log('ℹ️ [SignIn Security] id_token not available or cannot be decoded, using providerAccountId for verification');
          }
        } catch (idTokenError) {
          // id_token 驗證錯誤不應該阻止登入，因為 NextAuth 已經驗證了 OAuth 流程
          // 只記錄警告，繼續使用 providerAccountId 驗證
          console.warn('⚠️ [SignIn Security] Error validating id_token (non-blocking):', idTokenError);
        }
      }

      // 驗證 user.id 存在
      if (!user.id) {
        console.error('❌ [SignIn Security] Missing user.id. Login blocked.');
        return false;
      }

      const currentUserId = user.id.toString();
      console.log(`🔐 [SignIn] Provider: ${account.provider}, ProviderAccountId: ${providerAccountIdPreview}, UserId: ${currentUserId}`);

      try {
        const db = await connectToDatabase();
        const accountsCollection = db.collection('accounts');
        const usersCollection = db.collection('users');

        // 🔴 關鍵安全檢查：確保 id_token 的唯一性（僅對 LINE）
        // 注意：Google 的 id_token 每次登入可能不同（包含時間戳），所以只對 LINE 進行嚴格檢查
        // LINE 的 id_token 應該對應唯一的用戶，不能重複使用
        if (account.provider === 'line' && (account as any).id_token && typeof (account as any).id_token === 'string') {
          try {
            // 檢查是否有其他帳號（不同 providerAccountId）使用相同的 id_token
            const duplicateIdTokenAccount = await accountsCollection.findOne({
              provider: account.provider,
              id_token: (account as any).id_token,
              providerAccountId: { $ne: providerAccountId }, // 排除當前 providerAccountId
            });

            if (duplicateIdTokenAccount) {
              const duplicateUserId = duplicateIdTokenAccount.userId.toString();
              console.error('⛔ [Security Alert] CRITICAL: Duplicate LINE id_token detected! Different users cannot share the same id_token!', {
                provider: account.provider,
                id_token: (account as any).id_token?.substring(0, 20) + '...', // 只記錄前20字符
                existingProviderAccountId: duplicateIdTokenAccount.providerAccountId,
                attemptedProviderAccountId: providerAccountId,
                existingUserId: duplicateUserId,
                attemptedUserId: currentUserId,
              });
              // 這是嚴重安全問題，必須阻止登入
              return false;
            }

            // 額外檢查：即使 providerAccountId 相同，也要確保 userId 一致
            // 防止同一個 id_token 被連結到不同的用戶
            const sameIdTokenAccount = await accountsCollection.findOne({
              provider: account.provider,
              id_token: (account as any).id_token,
            });

            if (sameIdTokenAccount) {
              const linkedUserId = sameIdTokenAccount.userId.toString();
              if (linkedUserId !== currentUserId) {
                console.error('⛔ [Security Alert] CRITICAL: LINE id_token already linked to different user!', {
                  provider: account.provider,
                  id_token: (account as any).id_token?.substring(0, 20) + '...',
                  linkedUserId: linkedUserId,
                  attemptedUserId: currentUserId,
                  providerAccountId: providerAccountId,
                });
                return false;
              }
            }

            console.log('✅ [SignIn Security] LINE id_token uniqueness verified. No duplicate found.');
          } catch (idTokenCheckError) {
            // 🔴 關鍵決策：如果 LINE id_token 唯一性檢查失敗，為了安全起見應該拒絕登入
            // 這可以防止在資料庫故障時發生 id_token 混淆
            console.error('❌ [SignIn Security] CRITICAL: Failed to verify LINE id_token uniqueness. Login blocked for security.', idTokenCheckError);
            return false;
          }
        }

        // 檢查此 providerAccountId 是否已被連結到其他 User
        const existingAccount = await accountsCollection.findOne({
          provider: account.provider,
          providerAccountId: providerAccountId,
        });

        if (existingAccount) {
          // 帳號已存在 - 必須嚴格驗證
          const linkedUserId = existingAccount.userId.toString();

          // 🔴 關鍵安全檢查：如果 providerAccountId 已連結到不同的用戶，絕對不能允許登入
          if (linkedUserId !== currentUserId) {
            console.error(`⛔ [Security Alert] CRITICAL: Account hijacking attempt detected!`, {
              provider: account.provider,
              providerAccountId: providerAccountId,
              linkedUserId: linkedUserId,
              attemptedUserId: currentUserId,
            });
            // 記錄安全事件並阻止登入
            return false;
          }

          // 帳號已正確連結到當前用戶 - 允許登入並更新資料
          console.log(`✅ [SignIn] Existing account verified. ProviderAccountId ${providerAccountId} correctly linked to User ${currentUserId}`);

          // 更新使用者資料 (Backfill Name/Image)
          // 只有當使用者原本沒有名字或照片時才更新，避免覆蓋使用者自訂資料
          try {
            const existingUser = await usersCollection.findOne({ _id: new ObjectId(currentUserId) });
            if (existingUser) {
              const updates: any = {};
              
              // LINE 的 profile 欄位（OpenID Connect 格式）
              // 官方 LINE provider 返回: name, picture (不是 displayName, pictureUrl)
              const newName = (profile as any)?.name || profile?.displayName;
              const newImage = (profile as any)?.picture || (profile as any)?.pictureUrl;

              if (!existingUser.name && newName) updates.name = newName;
              if (!existingUser.image && newImage) updates.image = newImage;

              if (Object.keys(updates).length > 0) {
                await usersCollection.updateOne({ _id: new ObjectId(currentUserId) }, { $set: updates });
                console.log('✅ [SignIn] Updated user profile from provider data');
              }
            }
          } catch (updateError) {
            // 更新失敗不應該阻止登入，只記錄錯誤
            console.error('⚠️ [SignIn] Failed to update user profile:', updateError);
          }

          return true;
        } else {
          // 帳號不存在 - 這是新用戶首次登入
          // 注意：在 signIn callback 中無法檢查用戶是否已有其他帳號連結
          // 因為此時用戶可能還未建立。真正的檢查在 linkAccount 中進行。
          console.log(`✅ [SignIn] New account. ProviderAccountId ${providerAccountId} will be linked to User ${currentUserId}`);
          return true;
        }
      } catch (error) {
        // 🔴 關鍵安全決策：如果資料庫檢查失敗，為了安全起見應該拒絕登入
        // 這可以防止在資料庫故障時發生帳號混淆
        console.error('❌ [SignIn Security] CRITICAL: Database operation failed. Login blocked for security.', error);
        return false;
      }
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
      // 🔴 增加一個更新時間戳，防止 Client 端快取舊的 session
      (session.user as any).updatedAt = new Date().getTime();
      
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



