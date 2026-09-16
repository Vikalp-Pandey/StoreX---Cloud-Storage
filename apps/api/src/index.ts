import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { connectToMongoDb } from '@/db/db';
import { logger } from '@packages/httputils';
import authRoutes from '@/routes/authRoutes/auth.routes';
import oauthRoutes from '@/routes/authRoutes/oauth.routes';
import fileRoutes from '@/routes/fileRoutes/file.routes';
import multipartUploadRoutes from '@/routes/fileRoutes/multipartupload.routes';
import billingRoutes from '@/routes/billingRoutes/billing.routes';
import { errorHandler } from '@/middlewares/error.middleware';
import env from '@packages/env';

const app = new Hono();
app.use(
  '*',
  cors({
    origin: env!.ALLOWED_ORIGINS,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.onError(errorHandler);

app.get('/', (c) => {
  return c.json({ message: 'Storex Backend is running!' });
});

app.route('/api/auth', authRoutes);
app.route('/api/auth', oauthRoutes);
app.route('/api/files', fileRoutes);
app.route('/api/upload', multipartUploadRoutes);
app.route('/api/billing', billingRoutes);

connectToMongoDb(env!.DATABASE_URL);

serve(
  {
    fetch: app.fetch,
    port: env!.PORT,
  },
  () => {
    logger('INFO', `Server is running on http://localhost:${env!.PORT}`);
  },
);
