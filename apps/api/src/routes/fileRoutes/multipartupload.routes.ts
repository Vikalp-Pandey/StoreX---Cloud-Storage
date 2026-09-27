import { Hono } from 'hono';
import {
  startUpload,
  presignPart,
  completeUpload,
  abortUpload,
} from '@/controllers/fileControllers/multipartupload.controller';
import { authenticateUser, validateUser } from '@/middlewares/user.middleware';

const multipartUploadRoutes = new Hono();

multipartUploadRoutes.use('*', validateUser);
multipartUploadRoutes.use('*', authenticateUser);

multipartUploadRoutes.post('/start', startUpload);
multipartUploadRoutes.post('/presign-part', presignPart);
multipartUploadRoutes.post('/complete', completeUpload);
multipartUploadRoutes.post('/abort', abortUpload);

export default multipartUploadRoutes;
