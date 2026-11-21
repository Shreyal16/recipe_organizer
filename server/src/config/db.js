import mongoose from 'mongoose';

/**
 * Sanitizes MongoDB URI to mask username and password before logging.
 * Example: mongodb+srv://user:pass@cluster.mongodb.net/db -> mongodb+srv://***:***@cluster.mongodb.net/db
 */
export const maskMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '[UNDEFINED_URI]';
  return uri.replace(/\/\/[^@]+@/, '//***:***@');
};

let isConnected = false;

/**
 * Connects to MongoDB using Mongoose.
 * Reuses active connection if already connected.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    const errorMsg = 'MONGODB_URI is not defined in server environment configuration.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const masked = maskMongoUri(uri);
    console.log(`[Database] Connecting to MongoDB: ${masked}`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    isConnected = true;
    console.log(`[Database] MongoDB connection established successfully (host: ${conn.connection.host})`);

    mongoose.connection.on('error', (err) => {
      console.error('[Database Error] Ongoing MongoDB connection error occurred');
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database Warning] MongoDB connection was lost/disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database] MongoDB connection reconnected successfully');
      isConnected = true;
    });

    return conn;
  } catch (err) {
    console.error(`[Database Connection Failure] Unable to connect to MongoDB: ${err.message}`);
    isConnected = false;
    throw err;
  }
};

/**
 * Disconnects from MongoDB (used during shutdown or test teardown).
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB disconnected cleanly');
  }
};

export default connectDB;
