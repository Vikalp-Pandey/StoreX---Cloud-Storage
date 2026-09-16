import { Hono } from 'hono';
import {
  startUpload,
  presignPart,
  completeUpload,
  abortUpload,
} from '@/controllers/fileControllers/multipartupload.controller';

const multipartUploadRoutes = new Hono();

multipartUploadRoutes.post('/start', startUpload);
multipartUploadRoutes.post('/presign-part', presignPart);
multipartUploadRoutes.post('/complete', completeUpload);
multipartUploadRoutes.post('/abort', abortUpload);

export default multipartUploadRoutes;
