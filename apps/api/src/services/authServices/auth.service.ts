import crypto from 'crypto';
import env from '@packages/env';
import { logger } from '@packages/httputils';
import { ResetPassword } from '@/models/authModels/resetPassword.model';
import User from '@/models/authModels/user.model';
import jwt from 'jsonwebtoken';
import {
  verifyUserDocument,
  verifyUser,
  VerificationType,
} from '@/models/authModels/verifyUser.model';

export const signJwt = async (
  payload: Object,
  jwt_secret: string,
  options: Object,
) => {
  const token = jwt.sign(payload, jwt_secret, options);
  return token;
};

export const verifyJwt = async (token: string, jwt_secret: string) => {
  try {
    const decoded = jwt.verify(token, jwt_secret);
    return { decoded, expired: false };
  } catch (error: any) {
    logger('ERROR', 'JWT verification failed:', error.message);
    return {
      decoded: null,
      expired: error.name === 'TokenExpiredError',
    };
  }
};

export const findandreissueToken = async (email: string) => {
  const user = await User.findOne({ email: email });
  if (!user) return null;

  // Verify the existing token before reusing it
  if (user.access_token) {
    try {
      jwt.verify(user.access_token, env!.ACCESS_SECRET);
      return user.access_token; // Still valid, reuse it
    } catch {
      // Token is invalid/expired (e.g. secret changed), fall through to reissue
      logger('INFO', 'Existing token invalid, reissuing for:', email);
    }
  }

  // Issue a fresh token
  const token = await signJwt({ id: user._id.toString() }, env!.ACCESS_SECRET, {
    expiresIn: env!.ACCESS_SECRET_TTL,
  });
  logger('INFO', 'Access_Ttl:', env!.ACCESS_SECRET_TTL);
  user.access_token = token;
  await user.save();
  return user.access_token;
};
export const extractUser = async (token: string) => {
  const decoded = await verifyJwt(token, env!.ACCESS_SECRET);
  if (!decoded.decoded || typeof decoded.decoded == 'string') {
    return;
  }
  const userId = decoded.decoded.id;
  return userId;
};

export const generateOTP = async (
  email: string,
  verification_type: VerificationType,
) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await verifyUser.create({
    email,
    otp,
    verification_type,
  });
  return otp;
};

export const validateOTP = async (otp: string) => {
  try {
    const validOTP = await verifyUser.findOne({ otp });
    return validOTP;
  } catch (error) {
    return null;
  }
};

export const deleteOtp = async (otp: verifyUserDocument) => {
  try {
    verifyUser.deleteOne({ _id: otp._id });
  } catch (error) {
    return { OTPDeletionError: error };
  }
};

export const generateResetTokenandLink = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const resetLink = `${env!.ALLOWED_ORIGINS}/reset-password?token=${token}`;
  return { token, resetLink };
};

export const validateToken = async (token: string) => {
  try {
    const validToken = await ResetPassword.findOne({ token });
    console.log(validToken);
    // if (!validToken) return null
    return validToken;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const saveResetToken = async (userId: string, token: string) => {
  try {
    const savedRecord = await ResetPassword.create({
      userId,
      token,
    });
    return savedRecord;
  } catch (error) {
    throw new Error('Error saving reset token to database');
  }
};

const jwtService = {
  signJwt,
  verifyJwt,
  findandreissueToken,
  extractUser,
  generateOTP,
  validateOTP,
  deleteOtp,
  generateResetTokenandLink,
  validateToken,
  saveResetToken,
};
export default jwtService;
