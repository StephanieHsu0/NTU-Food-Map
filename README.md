# NTU Food Map - 台大美食推薦平台

A bilingual (Chinese/English) food recommendation platform for National Taiwan University students and international students.

🌐 **Live Demo:** https://ntu-food-map.vercel.app

## Features

- 🗺️ Interactive map with Leaflet showing food places near NTU
- 🔍 Advanced filtering (distance, rating, price, category, features)
- 📍 Place detail pages
- 🎰 Food roulette for random selection
- 🌐 Bilingual interface (Chinese/English)
- ⭐ Smart recommendation scoring (distance decay + rating + popularity + open status + context)
- 🔐 OAuth authentication (Google & LINE login)
- 💬 User comments and reviews system
- 👍 Like/dislike comments
- ⭐ User ratings (1-5 stars)
- 👤 User profile management
- 🔒 Secure account management with duplicate prevention

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Leaflet (with Marker Clustering)
- next-intl (i18n)

### Backend
- Next.js Route Handlers (Serverless Functions)
- MongoDB Atlas (with geospatial queries)
- NextAuth.js v5 (OAuth authentication)
- MongoDB Adapter for session management

## Project Structure

```
/
├─ client/          # Next.js frontend (with Serverless Functions)
│   ├─ app/        # App Router (pages + API routes)
│   ├─ components/ # React components
│   ├─ lib/        # Shared utilities (DB, scoring)
│   └─ utils/      # Helper functions
├─ server/         # Express backend (optional, for local dev)
├─ db/             # Database schema and seeds
└─ scripts/        # Data fetching and import scripts
```

詳細結構說明請參考 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## Deployment

The application is deployed on Vercel and can be accessed at:
- **Production URL:** https://ntu-food-map.vercel.app

For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier available) or local MongoDB
- Google Places API key (for data fetching and maps)
- Google OAuth credentials (for user authentication)
- LINE OAuth credentials (optional, for LINE login)

### 1. Install Dependencies

```bash
npm run install:all
```

Or install separately:

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Database Setup

#### Option 1: MongoDB Atlas (Recommended - Cloud Database)

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account (M0 Free Tier available)

2. **Create a Cluster**
   - Choose a cloud provider and region (closest to you)
   - Select "M0 Free" tier
   - Click "Create Cluster"

3. **Set Up Database Access**
   - Go to "Database Access" in the left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Set user privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Set Up Network Access**
   - Go to "Network Access" in the left menu
   - Click "Add IP Address"
   - For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add your specific IP addresses
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<username>` and `<password>` with your database user credentials
   - Add database name: `mongodb+srv://.../<database_name>?retryWrites=true&w=majority`

6. **Import Seed Data**
   ```bash
   # Set MONGODB_URI in .env file first (see step 3)
   node scripts/import_to_db.js
   ```

#### Option 2: Local MongoDB

**Install MongoDB:**

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Import Seed Data:**
```bash
# MongoDB runs on localhost:27017 by default
# Set MONGODB_URI=mongodb://localhost:27017/ntu_food_map in .env
node scripts/import_to_db.js
```

### 3. Environment Variables

#### 3.1 建立環境變數檔案

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
Copy-Item client\.env.example client\.env.local
Copy-Item server\.env.example server\.env
```

**Windows (Command Prompt):**
```cmd
copy .env.example .env
copy client\.env.example client\.env.local
copy server\.env.example server\.env
```

**macOS/Linux:**
```bash
cp .env.example .env
cp client/.env.example client/.env.local
cp server/.env.example server/.env
```

#### 3.2 環境變數設定說明

##### 📁 `client/.env.local` (必需 - Next.js 應用程式使用)

這是**最重要的環境變數檔案**，包含所有 Next.js 應用程式需要的設定。

```env
# ============================================
# 資料庫設定 (必需)
# ============================================
# MongoDB 連線字串
# 格式: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority
# 本地 MongoDB: mongodb://localhost:27017/ntu_food_map
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority

# 資料庫名稱
DB_NAME=ntu_food_map

# ============================================
# Google Maps API (必需)
# ============================================
# Google Maps JavaScript API 和 Places API 金鑰
# 獲取方式:
# 1. 前往 https://console.cloud.google.com/
# 2. 啟用 "Maps JavaScript API" 和 "Places API"
# 3. 建立 API 金鑰並設定 HTTP referrer 限制
#    開發環境: http://localhost:3000/*
#    生產環境: https://your-domain.vercel.app/*
NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ============================================
# NextAuth.js 認證設定 (必需)
# ============================================
# NextAuth.js 基礎 URL
# 開發環境: http://localhost:3000
# 生產環境: https://your-domain.vercel.app
AUTH_URL=http://localhost:3000

# NextAuth.js 加密密鑰 (用於 JWT 簽名)
# 產生方式: openssl rand -base64 32
# 或使用線上工具: https://generate-secret.vercel.app/32
AUTH_SECRET=your-generated-secret-key-at-least-32-characters-long

# ============================================
# Google OAuth 登入 (必需 - 至少需要一個 OAuth Provider)
# ============================================
# 方式 1: 使用 AUTH_GOOGLE_* (NextAuth v5 推薦)
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret

# 方式 2: 使用 GOOGLE_CLIENT_* (向後兼容)
# GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google OAuth 設定步驟:
# 1. 前往 https://console.cloud.google.com/
# 2. 啟用 "Google Identity Services API" 或 "Google+ API"
# 3. 前往「憑證」→「建立憑證」→「OAuth 用戶端 ID」
# 4. 應用程式類型選擇「網頁應用程式」
# 5. 設定授權重新導向 URI:
#    - 開發: http://localhost:3000/api/auth/callback/google
#    - 生產: https://your-domain.vercel.app/api/auth/callback/google
# 6. 複製 Client ID 和 Client Secret

# ============================================
# LINE OAuth 登入 (選填 - 可與 Google 同時使用)
# ============================================
# 方式 1: 使用 AUTH_LINE_* (NextAuth v5 推薦)
AUTH_LINE_ID=your-line-channel-id
AUTH_LINE_SECRET=your-line-channel-secret

# 方式 2: 使用 LINE_CHANNEL_* (向後兼容)
# LINE_CHANNEL_ID=your-line-channel-id
# LINE_CHANNEL_SECRET=your-line-channel-secret

# LINE OAuth 設定步驟:
# 1. 前往 https://developers.line.biz/
# 2. 建立新 Provider 或選擇現有 Provider
# 3. 建立新 Channel (選擇 "LINE Login")
# 4. 設定 Callback URL:
#    - 開發: http://localhost:3000/api/auth/callback/line
#    - 生產: https://your-domain.vercel.app/api/auth/callback/line
# 5. 複製 Channel ID 和 Channel Secret
```

##### 📁 `.env` (根目錄 - 可選，用於腳本和獨立後端)

```env
# ============================================
# 資料庫設定
# ============================================
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map

# ============================================
# Google Places API (用於資料擷取腳本)
# ============================================
# 用於 scripts/fetch_places.js 腳本
# 可以與 NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY 使用同一個 API Key
GOOGLE_PLACES_API_KEY=your_api_key_here

# ============================================
# 獨立後端伺服器設定 (可選)
# ============================================
SERVER_PORT=3001
```

##### 📁 `server/.env` (可選 - 僅在使用獨立後端時需要)

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map
GOOGLE_PLACES_API_KEY=your_api_key_here
SERVER_PORT=3001
```

#### 3.3 環境變數檢查清單

在啟動應用程式前，請確認以下項目：

- ✅ `MONGODB_URI` - MongoDB 連線字串已設定
- ✅ `DB_NAME` - 資料庫名稱已設定
- ✅ `NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY` - Google Maps API 金鑰已設定
- ✅ `AUTH_URL` - NextAuth 基礎 URL 已設定
- ✅ `AUTH_SECRET` - NextAuth 加密密鑰已產生（至少 32 字元）
- ✅ `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET` - Google OAuth 已設定（至少需要一個 OAuth Provider）
- ⚪ `AUTH_LINE_ID` 和 `AUTH_LINE_SECRET` - LINE OAuth 已設定（選填）

#### 3.4 重要注意事項

1. **安全性**
   - ⚠️ **絕對不要**將 `.env` 或 `.env.local` 檔案提交到 Git
   - 這些檔案已在 `.gitignore` 中，但請再次確認
   - 在 Vercel 部署時，需要在 Vercel Dashboard → Settings → Environment Variables 中設定所有環境變數

2. **環境變數命名**
   - Next.js 中，客戶端可用的變數必須以 `NEXT_PUBLIC_` 開頭
   - 伺服器端變數不需要前綴
   - NextAuth v5 使用 `AUTH_*` 命名（也支援 `NEXTAUTH_*` 作為向後兼容）

3. **OAuth Provider 設定**
   - 至少需要設定一個 OAuth Provider (Google 或 LINE)
   - 如果兩個都設定，使用者可以選擇使用哪個登入
   - 每個 Provider 的 Callback URL 必須正確設定，否則登入會失敗

4. **本地 MongoDB**
   - 如果使用本地 MongoDB，將 `MONGODB_URI` 設為: `mongodb://localhost:27017/ntu_food_map`
   - 確保 MongoDB 服務正在運行

5. **API 金鑰限制**
   - 建議為 Google Maps API 設定 HTTP referrer 限制
   - 建議為 Google OAuth 設定授權網域限制
   - 監控 API 使用量，避免超出配額

### 4. OAuth Provider Setup

#### Google OAuth Setup

1. **Create OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create a project
   - Enable "Google Identity Services API" or "Google+ API"
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application" as application type

2. **Configure Redirect URIs**
   - Add the following authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://your-domain.vercel.app/api/auth/callback/google`

3. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Add them to `client/.env.local` as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`

#### LINE OAuth Setup (Optional)

1. **Create LINE Channel**
   - Go to [LINE Developers Console](https://developers.line.biz/)
   - Create a new Provider or select an existing one
   - Create a new Channel (select "LINE Login")

2. **Configure Callback URL**
   - Add the following callback URLs:
     - Development: `http://localhost:3000/api/auth/callback/line`
     - Production: `https://your-domain.vercel.app/api/auth/callback/line`

3. **Copy Credentials**
   - Copy the Channel ID and Channel Secret
   - Add them to `client/.env.local` as `AUTH_LINE_ID` and `AUTH_LINE_SECRET`

**Note**: At least one OAuth provider (Google or LINE) must be configured for the application to work.

### 5. Generate AUTH_SECRET

Generate a secure random string for NextAuth.js:

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Online Tool:**
- Visit https://generate-secret.vercel.app/32

Copy the generated secret and add it to `client/.env.local` as `AUTH_SECRET`.

### 6. Fetch Data (Optional)

If you want to fetch data from Google Places API:

```bash
node scripts/fetch_places.js
node scripts/import_to_db.js
```

### 7. Start Development Server

**使用 Serverless Functions（推薦）:**
```bash
cd client
npm run dev
```
前端和 API 都運行在 http://localhost:3000

**或使用獨立後端（可選）:**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```
後端運行在 http://localhost:3001，前端運行在 http://localhost:3000

## API Endpoints

### Places API

#### GET /api/places
Get filtered list of places.

Query parameters:
- `lat`, `lng` - User location
- `radius` - Search radius in meters
- `price_max` - Maximum price level (1-4)
- `rating_min` - Minimum rating (0-5)
- `categories[]` - Filter by categories
- `features[]` - Filter by features (e.g., "international_friendly")
- `open_now` - Only show open places (true/false)

#### GET /api/places/:id
Get detailed information about a specific place.

#### POST /api/roulette
Get a random place from the filtered pool.

Body:
```json
{
  "lat": 25.0170,
  "lng": 121.5395,
  "filters": {
    "radius": 2000,
    "price_max": 3,
    "rating_min": 4.0
  }
}
```

### Authentication API

#### GET /api/auth/signin
Redirect to OAuth provider login page.

#### GET /api/auth/callback/:provider
OAuth callback endpoint (handled by NextAuth.js).

#### GET /api/auth/session
Get current user session.

#### POST /api/auth/signout
Sign out current user.

### Comments API

#### GET /api/comments?place_id=xxx&sort_by=time|likes
Get comments for a specific place.

Query parameters:
- `place_id` - Place ID (required)
- `sort_by` - Sort order: `time` (newest first) or `likes` (most liked first)

#### POST /api/comments
Create a new comment (requires authentication).

Body:
```json
{
  "place_id": "ChIJ...",
  "content": "Great food!",
  "rating": 5
}
```

#### PUT /api/comments/:id
Update a comment (requires authentication, only author can edit).

Body:
```json
{
  "content": "Updated comment",
  "rating": 4
}
```

#### DELETE /api/comments/:id
Delete a comment (requires authentication, only author can delete).

#### POST /api/comments/:id/like
Like a comment (requires authentication).

#### POST /api/comments/:id/dislike
Dislike a comment (requires authentication).

### User API

#### GET /api/user/current
Get current user information (requires authentication).

#### GET /api/user/profile
Get user profile with statistics (requires authentication).

#### PUT /api/user/profile
Update user profile (requires authentication).

#### GET /api/user/comments
Get current user's comments (requires authentication).

#### GET /api/user/favorites
Get current user's favorites (requires authentication).

### Favorites API

#### GET /api/favorites
Get user's favorite places (requires authentication).

#### POST /api/favorites
Add a place to favorites (requires authentication).

Body:
```json
{
  "place_id": "ChIJ...",
  "note": "My favorite restaurant"
}
```

#### DELETE /api/favorites/:id
Remove a favorite (requires authentication).

#### GET /api/favorites/check?place_id=xxx
Check if a place is favorited (requires authentication).

## Development

### Frontend
- Pages: `client/app/`
- Components: `client/components/`
- i18n: `client/lib/i18n/`

### Backend (Serverless Functions)
- API Routes: `client/app/api/`
- Database: `client/lib/db.ts`
- Scoring logic: `client/lib/scoring.ts`
- Authentication: `client/lib/auth.ts`
- MongoDB Adapter: `client/lib/mongodb-adapter.ts`

### Backend (獨立伺服器，可選)
- Server: `server/src/index.ts`
- Routes: `server/src/routes/`
- Scoring logic: `server/src/scoring.ts`

### Authentication System

The application uses NextAuth.js v5 for OAuth authentication:

- **Supported Providers**: Google OAuth, LINE OAuth
- **Session Strategy**: Database (stored in MongoDB)
- **Security Features**:
  - Prevents duplicate account linking
  - Validates id_token uniqueness for LINE
  - Prevents account hijacking
  - Secure session management

Key files:
- `client/lib/auth.ts` - NextAuth configuration and security callbacks
- `client/lib/mongodb-adapter.ts` - Custom MongoDB adapter for NextAuth
- `client/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler

### Database Schema

The application uses MongoDB with the following collections:

- **users** - User accounts (created by OAuth)
- **accounts** - OAuth account links (provider, providerAccountId, tokens)
- **sessions** - User sessions (managed by NextAuth)
- **comments** - User comments on places
- **favorites** - User favorite places
- **places** - Food place data

See [db/schema.md](./db/schema.md) for detailed schema documentation.

## Troubleshooting

### OAuth Login Issues

**Problem**: OAuth login redirects but fails or shows error

**Solutions**:
1. Check that callback URLs are correctly set in OAuth provider settings
2. Verify `AUTH_URL` matches your current domain (localhost:3000 for dev, your domain for production)
3. Ensure `AUTH_SECRET` is set and is at least 32 characters long
4. Check browser console and server logs for detailed error messages

**Problem**: "Account already linked to another user" error

**Solutions**:
1. This is a security feature preventing account hijacking
2. If testing with multiple accounts, ensure you sign out completely before switching
3. Clear browser cookies and session storage
4. Check MongoDB `accounts` collection for duplicate entries

### Database Connection Issues

**Problem**: Cannot connect to MongoDB

**Solutions**:
1. Verify `MONGODB_URI` is correct and includes database name
2. Check MongoDB Atlas Network Access settings (allow your IP or 0.0.0.0/0 for development)
3. Verify database user credentials are correct
4. For local MongoDB, ensure MongoDB service is running

### Environment Variables Not Loading

**Problem**: Environment variables are undefined

**Solutions**:
1. Ensure `.env.local` is in the `client/` directory (not root)
2. Restart the development server after changing environment variables
3. Check for typos in variable names (case-sensitive)
4. Verify no extra spaces around `=` in `.env.local` file

### Google Maps Not Loading

**Problem**: Map doesn't appear or shows error

**Solutions**:
1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY` is set correctly
2. Check Google Cloud Console that "Maps JavaScript API" and "Places API" are enabled
3. Verify API key restrictions allow your domain
4. Check browser console for specific error messages

## Security Notes

- **Never commit `.env` or `.env.local` files to Git**
- **Use strong, unique `AUTH_SECRET` values**
- **Set up API key restrictions in Google Cloud Console**
- **Use environment-specific OAuth redirect URIs**
- **Regularly rotate OAuth credentials**
- **Monitor API usage to prevent quota exhaustion**

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/)

## License

MIT

