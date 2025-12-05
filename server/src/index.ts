import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectToDatabase, { closeDatabase } from './db';
import placesRouter from './routes/places';
import rouletteRouter from './routes/roulette';

// 讀取根目錄的 .env 檔案（僅在本地開發時使用）
// 在部署環境（Railway/Render）中，環境變數會自動從平台設定讀取
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database on startup
connectToDatabase().catch(console.error);

// Routes
app.use('/api/places', placesRouter);
app.use('/api/roulette', rouletteRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NTU Food Map API is running' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

// 在部署環境中，Railway/Render 會自動設定 PORT
const serverPort = process.env.PORT || PORT;

app.listen(serverPort, '0.0.0.0', () => {
  console.log(`Server is running on port ${serverPort}`);
});

