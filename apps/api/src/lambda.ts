import { handle } from 'hono/aws-lambda';
import type { LambdaContext, LambdaEvent } from 'hono/aws-lambda';
import app from '@/app';
import { initializeDatabase } from '@/db/initialize';

const honoHandler = handle(app);

export const handler = async (event: LambdaEvent, context: LambdaContext) => {
  await initializeDatabase();
  return honoHandler(event, context);
};
