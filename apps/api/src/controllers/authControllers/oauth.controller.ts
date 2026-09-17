import { Context } from 'hono';
import jwtService from '@/services/authServices/auth.service';
import env from '@packages/env';
import {
  CookieConfig,
  logger,
  sendCookie,
  sendRedirect,
  sendResponse,
} from '@packages/httputils';
import oauthService from '@/services/authServices/oauth.service';
import userService from '@/services/authServices/user.service';
import { ensureStorageForUser } from '@/services/fileServices/storage.service';

const cookieConfig = {
  isSecure: env!.NODE_ENV === 'production',
  sameSite: env!.NODE_ENV === 'production' ? 'None' : 'Lax',
} as CookieConfig;

const handleAuthResponse = (c: Context) => {
  const frontendOrigin = env!.ALLOWED_ORIGINS[0];
  return sendRedirect(c, new URL('/dashboard', frontendOrigin).toString());
};

export const getGithubURL = async (c: Context) => {
  const githubOauthUrl = await oauthService.getGithubURL();
  return sendRedirect(c, githubOauthUrl);
};

export const signinwithGithub = async (c: Context) => {
  const code = c.req.query('code');
  if (typeof code !== 'string') {
    return sendResponse(c, 400, 'Invalid Code Type', { code: typeof code });
  }

  const githubUser = await oauthService.signinwithGithub(code);

  let isExisting = await userService.findUser({ email: githubUser.email });
  logger('INFO', '32 :GitHub User Info', isExisting);

  if (isExisting) {
    logger('ERROR', 'User with this email exists.');

    const token = await jwtService.findandreissueToken(isExisting.email);

    if (!token) {
      return sendResponse(c, 404, 'Token not Found');
    }
    await ensureStorageForUser(isExisting._id);
    sendCookie(c, 'accessToken', token, cookieConfig, {
      maxAge: 1000 * 60 * 60,
    });

    return handleAuthResponse(c);
  }

  let newUser = await userService.createUser(githubUser);

  const token = await jwtService.signJwt(
    { id: newUser._id },
    env!.ACCESS_SECRET,
    { expiresIn: '7d' },
  );
  newUser.access_token = token;
  await ensureStorageForUser(newUser._id);

  sendCookie(c, 'accessToken', token, cookieConfig, {
    maxAge: 1000 * 60 * 60,
  });

  return handleAuthResponse(c);
};

export const getGoogleURL = async (c: Context) => {
  const googleOauthUrl = await oauthService.getGoogleURL();
  // logger('INFO', 'Google Url', googleOauthUrl);
  return sendRedirect(c, googleOauthUrl);
};

export const signinwithGoogle = async (c: Context) => {
  const code = c.req.query('code');
  if (typeof code !== 'string') {
    return sendResponse(c, 400, 'Invalid Code Type', { code: typeof code });
  }

  const googleUser = await oauthService.signinwithGoogle(code);

  let isExisting;
  try {
    isExisting = await userService.findUser({ email: googleUser.email });
  } catch (error) {
    logger('ERROR', 'Error while finding user:', error);
    // return sendResponse(c, 500, 'Internal Server Error')
  }
  if (isExisting) {
    const token = await jwtService.findandreissueToken(isExisting.email);

    if (!token) {
      return sendResponse(c, 404, 'Token not Found');
    }

    await ensureStorageForUser(isExisting._id);
    sendCookie(c, 'accessToken', token, cookieConfig, {
      maxAge: 1000 * 60 * 60,
    });
    return handleAuthResponse(c);
  }

  let newUser = await userService.createUser(googleUser);

  const token = await jwtService.signJwt(
    { id: newUser._id },
    env.ACCESS_SECRET,
    { expiresIn: '7d' },
  );

  newUser.access_token = token;
  await ensureStorageForUser(newUser._id);

  sendCookie(c, 'accessToken', token, cookieConfig, {
    maxAge: 1000 * 60 * 60,
  });

  return handleAuthResponse(c);
};

const oauthController = {
  getGithubURL,
  signinwithGithub,
  getGoogleURL,
  signinwithGoogle,
};

export default oauthController;
