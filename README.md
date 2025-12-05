# NTU Food Map - 台大美食推薦平台

A bilingual (Chinese/English) food recommendation platform for National Taiwan University students and international students.

🌐 **Live Demo:** https://ntu-foodmap.vercel.app

## Features

- 🗺️ Interactive map with Leaflet showing food places near NTU
- 🔍 Advanced filtering (distance, rating, price, category, features)
- 📍 Place detail pages
- 🎰 Food roulette for random selection
- 🌐 Bilingual interface (Chinese/English)
- ⭐ Smart recommendation scoring (distance decay + rating + popularity + open status + context)

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
- **Production URL:** https://ntu-foodmap.vercel.app

For deployment instructions, see [VERCEL_DEPLOY_FULL.md](./VERCEL_DEPLOY_FULL.md).

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier available) or local MongoDB
- Google Places API key (for data fetching)

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

Edit the files with your database credentials and API keys:

**`.env` (root directory):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map
GOOGLE_PLACES_API_KEY=your_api_key_here
SERVER_PORT=3001
```

**`client/.env.local`（Serverless Functions 使用）:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map
```

**或（如果使用獨立後端）:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**`server/.env`:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map
GOOGLE_PLACES_API_KEY=your_api_key_here
SERVER_PORT=3001
```

**Note:** For local MongoDB, use: `MONGODB_URI=mongodb://localhost:27017/ntu_food_map`

### 4. Fetch Data (Optional)

If you want to fetch data from Google Places API:

```bash
node scripts/fetch_places.js
node scripts/import_to_db.js
```

### 5. Start Development Server

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

### GET /api/places
Get filtered list of places.

Query parameters:
- `lat`, `lng` - User location
- `radius` - Search radius in meters
- `price_max` - Maximum price level (1-4)
- `rating_min` - Minimum rating (0-5)
- `categories[]` - Filter by categories
- `features[]` - Filter by features (e.g., "international_friendly")
- `open_now` - Only show open places (true/false)

### GET /api/places/:id
Get detailed information about a specific place.

### POST /api/roulette
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

## Development

### Frontend
- Pages: `client/app/`
- Components: `client/components/`
- i18n: `client/lib/i18n/`

### Backend (Serverless Functions)
- API Routes: `client/app/api/`
- Database: `client/lib/db.ts`
- Scoring logic: `client/lib/scoring.ts`

### Backend (獨立伺服器，可選)
- Server: `server/src/index.ts`
- Routes: `server/src/routes/`
- Scoring logic: `server/src/scoring.ts`

## License

MIT

