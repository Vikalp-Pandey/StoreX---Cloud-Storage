import Stripe from 'stripe';
import env from '@packages/env';

let client: Stripe | undefined;

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe billing is not configured');
  }
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}
