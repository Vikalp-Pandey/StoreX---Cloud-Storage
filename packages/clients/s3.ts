// File storage client
import { S3Client } from '@aws-sdk/client-s3';
import env from '@packages/env';
const S3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
});
export default S3;
