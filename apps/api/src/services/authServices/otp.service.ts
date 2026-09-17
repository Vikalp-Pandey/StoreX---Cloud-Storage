import { randomInt } from 'node:crypto';
import type { ClientSession } from 'mongoose';
import {
  VerificationType,
  verifyUser,
} from '@/models/authModels/verifyUser.model';

export const createOtpChallenge = async (
  email: string,
  verificationType: VerificationType,
  session: ClientSession,
) => {
  const otp = randomInt(100000, 1000000).toString();

  const [challenge] = await verifyUser.create(
    [
      {
        email: email.trim().toLowerCase(),
        otp,
        verificationType,
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    ],
    { session },
  );

  return { challengeId: challenge._id.toString(), otp };
};

export const validateOtpChallenge = async (
  input: {
    challengeId: string;
    email: string;
    otp: string;
    verificationType: VerificationType;
  },
  session: ClientSession,
) => {
  const challenge = await verifyUser
    .findOne({
      _id: input.challengeId,
      email: input.email.trim().toLowerCase(),
      verificationType: input.verificationType,
      consumedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
      attempts: { $lt: 5 },
    })
    .select('+otp')
    .session(session);

  if (!challenge) {
    return { ok: false as const, reason: 'INVALID' };
  }

  if (challenge.otp !== input.otp) {
    challenge.attempts += 1;
    await challenge.save({ session });
    return { ok: false as const, reason: 'INVALID' };
  }

  challenge.consumedAt = new Date();
  await challenge.save({ session });

  return { ok: true as const, challenge };
};
