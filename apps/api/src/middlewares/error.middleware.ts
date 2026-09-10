import { Context } from 'hono';
import { ApiError } from '@packages/httputils';

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof ApiError) {
    return c.json(
      {
        success: false,
        message: err.message,
      },
      err.statusCode as any,
    );
  }

  return c.json(
    {
      success: false,

      error: { stack: err.stack, message: err.message },
      message: 'Internal Server Error',
    },
    500,
  );
};
