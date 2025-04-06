import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/v1/auth';
import { authorizeRequest } from './middlewares/authorizeRequest';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(authorizeRequest);

// Routes
app.use('/api/v1/auth', authRoutes);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MeetNotes Backend is running 🚀' });
});

export default app;
