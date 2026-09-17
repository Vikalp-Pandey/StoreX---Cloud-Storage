import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { sendResponse } from '@packages/httputils';
import { verifyJwt } from '@/services/authServices/auth.service';
import env from '@packages/env';
import userService from '@/services/authServices/user.service';

interface MyJwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export const validateUser = async (c: Context, next: Next) => {
  const token = getCookie(c, 'accessToken');

  if (!token) {
    return sendResponse(c, 401, 'Unauthorized User');
  }

  const decoded = await verifyJwt(token, env.ACCESS_SECRET);

  if (!decoded || !decoded.decoded) {
    return sendResponse(c, 401, 'Invalid Token');
  }

  const payload = decoded.decoded as MyJwtPayload;
  const userId = payload.id;
  const existingUser = await userService.findUser({ id: userId });

  if (!existingUser) {
    return sendResponse(c, 401, 'User not found');
  }

  c.set('user', existingUser);
  await next();
};

export const authenticateUser = async (c: Context, next: Next) => {
  const user = await c.get('user');
  if (!user) {
    return sendResponse(c, 401, 'Unauthenticated User');
  }
  await next();
};
