import { Context } from 'hono';
import { ApiError } from '@packages/httputils';
import Stripe from 'stripe';

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
    return c.json({ success: false, message: 'Invalid Stripe signature' }, 400);
  }
  if (err instanceof ApiError) {
    return c.json(
      {
        success: false,
        message: err.message,
      },
      err.statusCode as any,
    );
  }

  if ('code' in err && err.code === 11000) {
    return c.json(
      { success: false, message: 'User with email already exists' },
      409,
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
