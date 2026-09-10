import { Context, Next } from 'hono';
import { setCookie } from 'hono/cookie';

type HandlerFn = (c: Context, next: Next) => any | Promise<any>;

export const asyncHandler = (fn: HandlerFn) => {
  return async (c: Context, next: Next) => {
    try {
      return await fn(c, next);
    } catch (error) {
      throw error;
    }
  };
};

export const sendResponse = (
  c: Context,
  statusCode: number,
  detail?: string,
  data?: any,
) => {
  if (detail) {
    return c.json(
      {
        success: statusCode < 400,
        statusCode,
        detail,
        ...(data && { data }),
      },
      statusCode as any,
    );
  }
  return c.json(
    {
      success: statusCode < 400,
      statusCode,
      ...(data && { data }),
    },
    statusCode as any,
  );
};

interface RedirectOptions {
  statusCode?: number;
  queryParams?: Record<string, string | number>;
}

export const sendRedirect = (
  c: Context,
  url: string,
  options?: RedirectOptions,
) => {
  const statusCode = options?.statusCode || 302;

  let redirectUrl = url;

  if (options?.queryParams) {
    const params = new URLSearchParams(
      options.queryParams as Record<string, string>,
    ).toString();

    redirectUrl += url.includes('?') ? `&${params}` : `?${params}`;
  }

  return c.redirect(redirectUrl, statusCode as 301 | 302);
};

export interface CookieConfig {
  isSecure: boolean;
  sameSite: 'Lax' | 'None' | 'Strict';
}

export const sendCookie = (
  c: Context,
  label: string,
  token: string,
  config: CookieConfig,
  options: {
    maxAge?: number;
    expires?: Date;
    sameSite?: 'Lax' | 'None' | 'Strict';
  } = {},
) => {
  setCookie(c, label, token, {
    httpOnly: true,
    path: '/',
    secure: config.isSecure,
    sameSite: options.sameSite || config.sameSite,
    ...(options.maxAge && { maxAge: Math.floor(options.maxAge / 1000) }),
    ...(options.expires && { expires: options.expires }),
  });
};

export const logger = (
  messageInfo: 'INFO' | 'ERROR',
  detail: string,
  message?: unknown,
) => {
  console.log(`${messageInfo}: ${detail}`);
  if (message) {
    console.log(message);
  }
};

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
