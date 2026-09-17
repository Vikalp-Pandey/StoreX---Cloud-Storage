import { Hono } from 'hono';
import { cors } from 'hono/cors';
import env from '@packages/env';
import authRoutes from '@/routes/authRoutes/auth.routes';
import oauthRoutes from '@/routes/authRoutes/oauth.routes';
import fileRoutes from '@/routes/fileRoutes/file.routes';
import multipartUploadRoutes from '@/routes/fileRoutes/multipartupload.routes';
import billingRoutes from '@/routes/billingRoutes/billing.routes';
import { errorHandler } from '@/middlewares/error.middleware';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.onError(errorHandler);

app.get('/', (context) =>
  context.json({ message: 'StoreX Backend is running!' }),
);
app.get('/health', (context) =>
  context.json({ status: 'ok', region: env.AWS_REGION }),
);

app.route('/api/auth', authRoutes);
app.route('/api/auth', oauthRoutes);
app.route('/api/files', fileRoutes);
app.route('/api/upload', multipartUploadRoutes);
app.route('/api/billing', billingRoutes);

export default app;
