import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[QuantPulse AI] Backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[QuantPulse AI] Health check available at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`[QuantPulse AI] Fatal server startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
