import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { seedDatabase } from './services/seedService';

dotenv.config();

const runSeed = async () => {
  await connectDB();
  await seedDatabase();
  process.exit(0);
};

runSeed();
