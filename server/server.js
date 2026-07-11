import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
import resumeRoutes from './routes/resume.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import userRoutes from './routes/user.routes.js';
import githubRoutes from './routes/github.routes.js';
import authRoutes from './routes/auth.routes.js';

app.use('/api', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/user', userRoutes);
app.use('/api', githubRoutes);
app.use('/api/auth', authRoutes);

// Serve frontend in production
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke in the server!' });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-interview-platform', {
  autoIndex: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('\n🔴 MONGODB CONNECTION ERROR:');
  console.error('Make sure MongoDB is installed and running locally on port 27017,');
  console.error('or update MONGO_URI in .env with your MongoDB Atlas connection string.\n');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
