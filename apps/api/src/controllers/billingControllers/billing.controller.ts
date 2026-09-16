import type { Context } from 'hono';
import { asyncHandler, ApiError } from '@packages/httputils';
import { getStripe } from '@packages/clients/stripe';
import env from '@packages/env';
import { Subscription, type PaidPlan } from '@/models/billingModels/subscription.model';
import {
  createCheckoutForUser, createPortalForUser, processStripeEvent,
} from '@/services/billing.service';

export const checkout = asyncHandler(async (c: Context) => {
  const body = await c.req.json();
  if (body?.plan !== 'pro' && body?.plan !== 'ultra') {
    throw new ApiError(400, 'Choose pro or ultra');
  }
  const url = await createCheckoutForUser(c.get('user'), body.plan as PaidPlan);
  return c.json({ url });
});

export const portal = asyncHandler(async (c: Context) => {
  const url = await createPortalForUser(c.get('user')._id);
  return c.json({ url });
});

export const currentSubscription = asyncHandler(async (c: Context) => {
  const record = await Subscription.findOne({ user: c.get('user')._id })
    .select('plan amount currency status stripeSubscriptionId')
    .lean();
  return c.json({
    billingReady: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET &&
      env.STRIPE_PRO_PRICE_ID && env.STRIPE_ULTRA_PRICE_ID && env.APP_URL),
    plan: record?.status === 'active' ? record.plan : 'free',
    subscription: record ? {
      plan: record.plan,
      amount: record.amount,
      currency: record.currency,
      status: record.status,
      hasSubscription: Boolean(record.stripeSubscriptionId &&
        !['canceled', 'incomplete_expired', 'checkout_pending'].includes(record.status)),
    } : null,
  });
});

export const webhook = asyncHandler(async (c: Context) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(503, 'Stripe webhook is not configured');
  }
  const signature = c.req.header('stripe-signature');
  if (!signature || !/(^|,)t=\d+(,|$)/.test(signature) ||
      !/(^|,)v1=[0-9a-f]{64}(,|$)/i.test(signature)) {
    throw new ApiError(400, 'Invalid Stripe signature header');
  }
  const event = getStripe().webhooks.constructEvent(
    await c.req.text(), signature, env.STRIPE_WEBHOOK_SECRET,
  );
  await processStripeEvent(event);
  return c.json({ received: true });
});
