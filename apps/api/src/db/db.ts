import mongoose from 'mongoose';
import { logger } from '@packages/httputils';

export const connectToMongoDb = async (MongoURI: string) => {
  try {
    await mongoose.connect(MongoURI);
    logger('INFO', 'MongoDB connected successfully');
  } catch (error: any) {
    logger('ERROR', `DbConnectionError: ${error.message}`);
  }
};
