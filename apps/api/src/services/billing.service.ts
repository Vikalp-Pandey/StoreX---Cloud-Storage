import type Stripe from 'stripe';
import { Types } from 'mongoose';
import { getStripe } from '@packages/clients/stripe';
import env from '@packages/env';
import { ApiError } from '@packages/httputils';
import { Subscription, type PaidPlan } from '@/models/billingModels/subscription.model';
import { Storage } from '@/models/fileModels/storage.model';
import { ensureStorageForUser } from '@/services/fileServices/storage.service';

export const paidPlans = {
  pro: { priceId: env.STRIPE_PRO_PRICE_ID, limit: '100GB' },
  ultra: { priceId: env.STRIPE_ULTRA_PRICE_ID, limit: '1TB' },
} as const;

export function requireBillingConfig() {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET ||
      !env.STRIPE_PRO_PRICE_ID || !env.STRIPE_ULTRA_PRICE_ID || !env.APP_URL) {
    throw new ApiError(503, 'Stripe billing is not fully configured');
  }
}

export async function createCheckoutForUser(
  user: { _id: Types.ObjectId; email: string },
  plan: PaidPlan,
) {
  requireBillingConfig();
  await ensureStorageForUser(user._id);
  const stripe = getStripe();
  const existing = await Subscription.findOne({ user: user._id });
  if (existing?.status === 'checkout_pending' && existing.stripeCheckoutSessionId) {
    const pending = await stripe.checkout.sessions.retrieve(existing.stripeCheckoutSessionId);
    if (pending.status === 'open' && pending.url) return pending.url;
    if (pending.status === 'complete') {
      throw new ApiError(409, 'Waiting for Stripe to confirm the previous checkout');
    }
  }
  if (existing?.stripeSubscriptionId &&
      !['canceled', 'incomplete_expired', 'checkout_pending'].includes(existing.status)) {
    throw new ApiError(409, 'Manage your existing subscription in Billing');
  }

  const priceId = paidPlans[plan].priceId!;
  const price = await stripe.prices.retrieve(priceId);
  if (!price.active || price.type !== 'recurring' ||
      price.recurring?.interval !== 'month' || price.unit_amount === null) {
    throw new ApiError(503, 'The Stripe plan price must be an active monthly flat rate');
  }

  const customerId = existing?.stripeCustomerId ??
    (await stripe.customers.create(
      { email: user.email, metadata: { userId: String(user._id) } },
      { idempotencyKey: 'storex-customer-' + String(user._id) },
    )).id;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: env.APP_URL! + '/dashboard/billing?checkout=success',
    cancel_url: env.APP_URL! + '/dashboard/billing?checkout=cancel',
    client_reference_id: String(user._id),
    subscription_data: { metadata: { userId: String(user._id) } },
  });
  if (!session.url) throw new ApiError(502, 'Stripe Checkout URL unavailable');

  await Subscription.updateOne(
    { user: user._id },
    {
      $set: {
        plan, amount: price.unit_amount, currency: price.currency,
        status: 'checkout_pending', stripeCustomerId: customerId,
        stripeCheckoutSessionId: session.id,
      },

    },
    { upsert: true },
  );
  return session.url;
}

export async function createPortalForUser(userId: Types.ObjectId) {
  requireBillingConfig();
  const subscription = await Subscription.findOne({ user: userId });
  if (!subscription?.stripeCustomerId) {
    throw new ApiError(404, 'No billing customer found');
  }
  const session = await getStripe().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: env.APP_URL! + '/dashboard/billing',
  });
  return session.url;
}

export async function syncSubscription(stripeSubscription: Stripe.Subscription) {
  const userId = stripeSubscription.metadata.userId;
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Stripe subscription has no valid StoreX user ID');
  }
  const record = await Subscription.findOne({ user: userId });
  const customerId = typeof stripeSubscription.customer === 'string'
    ? stripeSubscription.customer
    : stripeSubscription.customer.id;
  if (!record || record.stripeCustomerId !== customerId) {
    throw new Error('Stripe customer does not match the StoreX subscription');
  }
  if (record.status === 'checkout_pending' &&
      record.stripeSubscriptionId === stripeSubscription.id) {
    return; // Ignore a delayed event for the previous, canceled subscription.
  }
  if (record.stripeSubscriptionId &&
      record.stripeSubscriptionId !== stripeSubscription.id &&
      record.status === 'active') {
    return; // A delayed event from an older subscription.
  }

  const price = stripeSubscription.items.data[0]?.price;
  const plan = price?.id === paidPlans.pro.priceId ? 'pro'
    : price?.id === paidPlans.ultra.priceId ? 'ultra' : null;
  if (!plan || price.unit_amount === null) {
    throw new Error('Stripe subscription has an unknown or non-flat-rate price');
  }

  const active = stripeSubscription.status === 'active';
  await ensureStorageForUser(userId);
  await Subscription.updateOne(
    { user: userId },
    {
      $set: {
        plan, amount: price.unit_amount, currency: price.currency,
        status: stripeSubscription.status,
        stripeSubscriptionId: stripeSubscription.id,
      },
    },
  );
  const updated = await Storage.updateOne(
    { user: userId },
    { $set: { limit: active ? paidPlans[plan].limit : '5GB' } },
  );
  if (updated.matchedCount !== 1) {
    throw new Error('StoreX storage record missing for Stripe subscriber');
  }
}

export async function processStripeEvent(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== 'subscription' || !session.subscription) return;
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription : session.subscription.id;
    await syncSubscription(await getStripe().subscriptions.retrieve(subscriptionId));
  }
  if (event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted') {
    const incoming = event.data.object as Stripe.Subscription;
    // Read current Stripe state so retried or out-of-order events cannot roll back a plan.
    const current = await getStripe().subscriptions.retrieve(incoming.id);
    await syncSubscription(current);
  }
}
