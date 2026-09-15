import mongoose from 'mongoose';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import env from '@packages/env';
import { EmailService } from '@services/emailservices';
import { connectToMongoDb } from '@/db/db';
import User from '@/models/authModels/user.model';
import {
  VerificationType,
  verifyUser,
} from '@/models/authModels/verifyUser.model';
import { signupEmailQueue } from '@/services/emailServices/signupEmail.queue';

const emailService = new EmailService(
  env.SMTP_NAME,
  env.SMTP_MAIL,
  env.SMTP_REPLY_TO,
  env.SMTP_HOST,
  env.SMTP_PORT,
  env.SMTP_USERNAME,
  env.SMTP_PASSWORD,
);

const main = async () => {
  await connectToMongoDb(env.DATABASE_URL);

  let stopping = false;
  process.once('SIGINT', () => {
    stopping = true;
  });
  process.once('SIGTERM', () => {
    stopping = true;
  });

  while (!stopping) {
    const { Messages = [] } = await signupEmailQueue.send(
      new ReceiveMessageCommand({
        QueueUrl: env.SQS_EMAIL_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 60,
      }),
    );

    for (const message of Messages) {
      if (!message.Body || !message.ReceiptHandle) continue;

      try {
        const job = JSON.parse(message.Body) as { challengeId?: string };
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

        await signupEmailQueue.send(
          new DeleteMessageCommand({
            QueueUrl: env.SQS_EMAIL_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          }),
        );
      } catch (error) {
        // Not deleting the message lets SQS retry it after VisibilityTimeout.
        console.error('Signup email job failed:', error);
      }
    }
  }

  await mongoose.disconnect();
};

void main().catch((error) => {
  console.error('Signup email worker stopped:', error);
  process.exitCode = 1;
});
