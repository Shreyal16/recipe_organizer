import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env from process.cwd() or fallback to server/.env relative to this file
dotenv.config();
if (!process.env.MONGODB_URI) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

import { connectDB, disconnectDB, maskMongoUri } from '../config/db.js';
import { seedRecipes, sampleRecipes } from './seedRecipes.js';

const run = async () => {
  console.log('--- MongoDB Recipe Seeder ---');
  console.log(`Prepared sample recipes: ${sampleRecipes.length}`);

  if (process.env.NODE_ENV === 'production') {
    console.error('[Safety Abort] Database seeding is disabled in production environment.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    console.warn('[Seeder Info] MONGODB_URI is not set in server/.env.');
    console.warn('To seed the database, configure MONGODB_URI in server/.env and verify target before execution.');
    process.exit(0);
  }

  console.log(`Target Database: ${maskMongoUri(uri)}`);

  try {
    await connectDB();
    console.log('[Seeder] Connected to database. Executing idempotent upsert seeding...');

    const result = await seedRecipes();

    console.log('--- Seeding Summary ---');
    console.log(`Total sample recipes processed: ${result.total}`);
    console.log(`Newly inserted recipes: ${result.inserted}`);
    console.log(`Updated existing recipes: ${result.updated}`);
    console.log(`Skipped due to error: ${result.skipped}`);
    console.log('-----------------------');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seeder Failure]', err.message);
    process.exit(1);
  }
};

run();
