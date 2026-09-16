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

  return c.json(
    {
      success: false,

      error: { stack: err.stack, message: err.message },
      message: 'Internal Server Error',
    },
    500,
  );
};
