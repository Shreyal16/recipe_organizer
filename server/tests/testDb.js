import { MongoMemoryServer, MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let currentServer = null;
let currentReplSet = null;

/**
 * Initializes an isolated standalone in-memory database.
 * Enforces strict environment and connection guards to guarantee zero external access.
 */
export const setupTestDb = async () => {
  process.env.NODE_ENV = 'test';

  currentServer = await MongoMemoryServer.create();
  const uri = currentServer.getUri();

  // Guard 1: Verify URI is strictly local loopback
  if (!uri || (!uri.includes('127.0.0.1') && !uri.includes('localhost'))) {
    throw new Error(`CRITICAL TEST SAFETY ERROR: In-memory URI must be local loopback! Got: ${uri}`);
  }

  process.env.MONGODB_URI = uri;

  // Guard 2: Verify environment variable assignment
  if (process.env.MONGODB_URI !== uri) {
    throw new Error('CRITICAL TEST SAFETY ERROR: process.env.MONGODB_URI does not match in-memory URI!');
  }

  // Connect Mongoose to the in-memory database
  await mongoose.connect(uri);

  // Guard 3: Verify actual Mongoose connection host
  const host = mongoose.connection.host;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    await mongoose.disconnect();
    throw new Error(`CRITICAL TEST SAFETY ERROR: Mongoose connected to external host: ${host}!`);
  }

  return { mongod: currentServer, uri };
};

/**
 * Initializes an isolated replica-set in-memory database for multi-document transaction testing.
 */
export const setupTestReplSetDb = async () => {
  process.env.NODE_ENV = 'test';

  currentReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = currentReplSet.getUri();

  if (!uri || (!uri.includes('127.0.0.1') && !uri.includes('localhost'))) {
    throw new Error(`CRITICAL TEST SAFETY ERROR: In-memory ReplSet URI must be local loopback! Got: ${uri}`);
  }

  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);

  const host = mongoose.connection.host;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    await mongoose.disconnect();
    throw new Error(`CRITICAL TEST SAFETY ERROR: Mongoose connected to external host: ${host}!`);
  }

  return { replSet: currentReplSet, uri };
};

/**
 * Clears all collections between test cases for complete test isolation.
 */
export const clearTestDb = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

/**
 * Cleanly disconnects and tears down the in-memory database instance.
 */
export const teardownTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (currentServer) {
    await currentServer.stop();
    currentServer = null;
  }

  if (currentReplSet) {
    await currentReplSet.stop();
    currentReplSet = null;
  }
};
