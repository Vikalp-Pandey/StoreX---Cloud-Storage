import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import env from '@packages/env';

export const signupEmailQueue = new SQSClient({ region: env.AWS_REGION });

export const enqueueSignupEmail = (challengeId: string) =>
  signupEmailQueue.send(
    new SendMessageCommand({
      QueueUrl: env.SQS_EMAIL_QUEUE_URL,
      MessageBody: JSON.stringify({ challengeId }),
    }),
  );
