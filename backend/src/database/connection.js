import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer = null;

const connectDB = async () => {
  try {
    // Try connecting to real MongoDB first
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scamshield', {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log('⚠️  Real MongoDB not available, starting in-memory MongoDB for testing...');
    
    try {
      // Fallback to in-memory MongoDB for testing/development
      if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ In-memory MongoDB started for testing`);
        return conn;
      }
    } catch (memoryError) {
      console.error(`❌ Failed to start in-memory MongoDB: ${memoryError.message}`);
      console.error('Please install MongoDB or ensure it is running on localhost:27017');
      process.exit(1);
    }
  }
};

export default connectDB;
