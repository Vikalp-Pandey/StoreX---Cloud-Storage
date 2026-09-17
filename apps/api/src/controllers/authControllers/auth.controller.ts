import { Context } from 'hono';
import { EmailService } from '@services/emailservices';
import env from '@packages/env';
import {
  logger,
  sendCookie,
  sendResponse,
  CookieConfig,
} from '@packages/httputils';
import { accountType } from '@/models/authModels/user.model';
import jwtService from '@/services/authServices/auth.service';
import userService from '@/services/authServices/user.service';
import authService from '@/services/authServices/auth.service';
import { VerificationType } from '@/models/authModels/verifyUser.model';
import { ensureStorageForUser } from '@/services/fileServices/storage.service';
import { createSignupAccount } from '@/services/authServices/signup.service';
import { verifySignupEmail } from '@/services/authServices/emailVerification.service';
import { enqueueSignupEmail } from '@/services/emailServices/signupEmail.queue';

const cookieConfig = {
  isSecure: env!.NODE_ENV === 'production',
  sameSite: env!.NODE_ENV === 'production' ? 'None' : 'Lax',
} as CookieConfig;

const emailService = new EmailService(
  env!.SMTP_NAME,
  env!.SMTP_MAIL,
  env!.SMTP_REPLY_TO,
  env!.SMTP_HOST,
  env!.SMTP_PORT,
  env!.SMTP_USERNAME,
  env!.SMTP_PASSWORD,
);

const setAccessTokenCookie = (
  c: Context,
  accessToken: string,
  options: any = {},
) => {
  sendCookie(c, 'accessToken', accessToken, cookieConfig, {
    sameSite: 'Lax',
    maxAge: 1000 * 60 * 60,
    ...options,
  });
};

const sendOtpEmail = async (
  email: string,
  name: string,
  otp: string,
  subject: string,
) => {
  await emailService.sendEmail({
    to: email,
    subject,
    template: {
      type: 'email_otp',
      data: {
        to_username: name,
        otp,
      },
    },
  });
};

export const getUserStatus = async (c: Context) => {
  const user = c.get('user');
  if (user) {
    return sendResponse(c, 200, 'User Info', { user });
  }
  return sendResponse(c, 401, 'User Info:', { message: 'Not logged in' });
};

export const signupUser = async (c: Context) => {
  const { name, email, password } = await c.req.json();

  if (!name || !email || !password) {
    return sendResponse(c, 400, 'Name, email and password are required');
  }

  const result = await createSignupAccount({ name, email, password });
  await enqueueSignupEmail(result.challengeId);

  return sendResponse(c, 201, 'Account created. Verification email queued.', {
    userId: result.userId,
    email: result.email,
    challengeId: result.challengeId,
  });
};

export const signinUser = async (c: Context) => {
  const { email, password } = await c.req.json();

  const user = await userService.findUser({ email, password });

  if (!user || !(user.accountType == accountType.Local)) {
    return sendResponse(c, 400, 'User not signed up');
  }

  if (user.emailVerified === false) {
    return sendResponse(c, 403, 'Unverified Email. Please verify this email');
  }

  if (user.twoFactorEnabled) {
    const otp = await authService.generateOTP(
      user.email,
      VerificationType.Signin,
    );

    await sendOtpEmail(
      email,
      user.name,
      otp,
      'OTP Verification through Email on Storex',
    );

    return sendResponse(c, 200, '2fa successfully enabled', {
      twoFactorRequired: true,
      message: 'Otp sent to registered email',
    });
  }

  const accessToken = await jwtService.findandreissueToken(email);

  if (!accessToken) {
    logger('ERROR', 'Token reissue failed:', email);
    return sendResponse(c, 404, 'Access token not found');
  }

  await ensureStorageForUser(user._id);
  setAccessTokenCookie(c, accessToken);

  return sendResponse(c, 200, 'User signed in successfully', {
    user,
    accessToken,
  });
};

export const logoutUser = async (c: Context) => {
  sendCookie(c, 'accessToken', '', cookieConfig, {
    sameSite: 'Lax',
    expires: new Date(0),
  });

  return sendResponse(c, 200, 'Logged out successfully');
};

export const verifyOTP = async (c: Context) => {
  const { otp } = await c.req.json();

  if (!otp) {
    logger('ERROR', 'OTP missing in request');
    return sendResponse(c, 400, 'OTP is required');
  }

  const validOtp = await jwtService.validateOTP(otp);

  if (!validOtp) {
    logger('ERROR', 'Invalid OTP attempt');
    return sendResponse(c, 400, 'Invalid OTP');
  }

  const user = await userService.findUser({ email: validOtp.email });
  if (!user) {
    return sendResponse(c, 404, 'User not found');
  }

  const accessToken = await jwtService.findandreissueToken(user.email);
  if (!accessToken) {
    return sendResponse(c, 500, 'AccessToken not Found');
  }

  await ensureStorageForUser(user._id);
  await jwtService.deleteOtp(validOtp);
  setAccessTokenCookie(c, accessToken, { maxAge: 3600000 });

  return sendResponse(c, 200, 'OTP verified successfully', {
    user,
    accessToken,
  });
};

export const verifyEmail = async (c: Context) => {
  const { challengeId, email, otp } = await c.req.json();

  if (!challengeId || !email || !otp) {
    return sendResponse(c, 400, 'Challenge ID, email and OTP are required');
  }

  const result = await verifySignupEmail({ challengeId, email, otp });
  if (!result.ok) {
    return sendResponse(c, 400, `OTP ${result.reason.toLowerCase()}`);
  }

  setAccessTokenCookie(c, result.accessToken);
  return sendResponse(c, 200, 'Email verified successfully', {
    user: {
      name: result.user.name,
      email: result.user.email,
      emailVerified: result.user.emailVerified,
      accessToken: result.accessToken,
    },
  });
};

export const forgotPassword = async (c: Context) => {
  const { email } = await c.req.json();

  const user = await userService.findUser({ email });

  if (!user) {
    logger('ERROR', 'Forgot password user not found:', email);
    return sendResponse(c, 404, 'User not found');
  }

  const { token, resetLink } = await jwtService.generateResetTokenandLink();

  await jwtService.saveResetToken(user.id, token);

  await emailService.sendEmail({
    to: email,
    subject: 'Reset Password on E-Bucket',
    template: {
      type: 'forgot_password',
      data: {
        to_username: user.name,
        reset_link: resetLink,
      },
    },
  });

  return sendResponse(c, 200, 'Password reset link sent to email');
};

export const resetPassword = async (c: Context) => {
  const { token, password } = await c.req.json();

  if (!token || typeof token !== 'string') {
    logger('ERROR', 'Invalid Token Type or missing', token);
    return sendResponse(c, 403, 'Invalid Token Type');
  }

  const validToken = await jwtService.validateToken(token);

  if (!validToken) {
    logger('ERROR', 'Invalid or expired reset token');
    return sendResponse(c, 400, 'Invalid or expired reset token');
  }

  const user = await userService.findUser({
    id: validToken.userId.toString(),
  });

  if (!user) {
    logger('ERROR', 'Reset token valid but user not found');
    return sendResponse(c, 404, 'User not found');
  }

  user.password = password;

  await user.save();

  return sendResponse(c, 200, 'Password reset successful');
};

const jwtAuthController = {
  getUserStatus,
  signupUser,
  signinUser,
  logoutUser,
  verifyOTP,
  verifyEmail,
  forgotPassword,
  resetPassword,
};

export default jwtAuthController;
