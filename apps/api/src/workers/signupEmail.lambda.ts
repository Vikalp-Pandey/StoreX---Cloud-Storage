import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import env from '@packages/env';
import { EmailService } from '@services/emailservices';
import { initializeDatabase } from '@/db/initialize';
import User from '@/models/authModels/user.model';
import {
  VerificationType,
  verifyUser,
} from '@/models/authModels/verifyUser.model';

const emailService = new EmailService(
  env.SMTP_NAME,
  env.SMTP_MAIL,
  env.SMTP_REPLY_TO,
  env.SMTP_HOST,
  env.SMTP_PORT,
  env.SMTP_USERNAME,
  env.SMTP_PASSWORD,
);

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  await initializeDatabase();
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

  for (const record of event.Records) {
    try {
      const job = JSON.parse(record.body) as { challengeId?: string };
      if (!job.challengeId) throw new Error('Missing challengeId');

      const challenge = await verifyUser
        .findById(job.challengeId)
        .select('+otp');

      if (
        challenge?.verificationType === VerificationType.Signup &&
        !challenge.consumedAt &&
        challenge.expiresAt.getTime() > Date.now()
      ) {
        const user = await User.findOne({ email: challenge.email });
        if (user && !user.emailVerified) {
          await emailService.sendEmail({
            to: challenge.email,
            subject: 'Email Verification for Signup on StoreX',
            template: {
              type: 'email_otp',
              data: { to_username: user.name, otp: challenge.otp },
            },
          });
        }
      }
    } catch (error) {
      console.error('Signup email job failed', {
        messageId: record.messageId,
        error,
      });
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
