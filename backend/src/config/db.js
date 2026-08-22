import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ [Database] MONGODB_URI not provided. Operating in High-Speed Dual-Mode (In-Memory + Atomic JSON Persistence).');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✓ [Database] Connected to MongoDB Atlas: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ [Database] MongoDB connection notice: ${err.message}. Falling back to Atomic Store.`);
    return false;
  }
}
