import mongoose from 'mongoose';
import env from '@packages/env';
import { connectToMongoDb } from '@/db/db';
import User from '@/models/authModels/user.model';
import { verifyUser } from '@/models/authModels/verifyUser.model';
import { Subscription } from '@/models/billingModels/subscription.model';

let initialization: Promise<void> | undefined;

export const initializeDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;

  initialization ??= (async () => {
    await connectToMongoDb(env.DATABASE_URL);
    await Promise.all([User.init(), verifyUser.init(), Subscription.init()]);
  })().catch((error) => {
    initialization = undefined;
    throw error;
  });

  await initialization;
};
