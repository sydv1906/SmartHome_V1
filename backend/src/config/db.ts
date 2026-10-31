import mongoose from 'mongoose';
import winston from 'winston';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smarthome_db';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Successfully connected to MongoDB at ${mongoUri.split('@').pop()}`);
  } catch (error) {
    const safeMongoUri = mongoUri.replace(/(mongodb(?:\+srv)?:\/\/)[^@/]+@/i, '$1[redacted]@');
    console.warn(`[Database Warning] Could not connect to primary MongoDB at ${safeMongoUri}. Retrying with local fallback or in-memory mode...`);
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/smarthome_db', {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`[Database] Connected to local fallback MongoDB.`);
    } catch (fallbackErr) {
      console.error(`[Database Error] MongoDB connection failed. Please ensure MongoDB service is running or MONGO_URI is set. Backend will run with cached/in-memory mode for development APIs.`);
    }
  }
};
