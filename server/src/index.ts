import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectToDatabase, { closeDatabase } from './db';
import placesRouter from './routes/places';
import rouletteRouter from './routes/roulette';

dotenv.config();

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

