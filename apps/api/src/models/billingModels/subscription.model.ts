import { Document, Schema, Types, model } from 'mongoose';

export type PaidPlan = 'pro' | 'ultra';

export interface SubscriptionRecord extends Document {
  user: Types.ObjectId;
  plan: PaidPlan;
  amount: number; // Smallest currency unit (USD cents), from the Stripe Price.
  currency: string;
  status: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
}

const subscriptionSchema = new Schema<SubscriptionRecord>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    plan: { type: String, enum: ['pro', 'ultra'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String },
    stripeCheckoutSessionId: { type: String },
  },
  { timestamps: true },
);

subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index(
  { stripeSubscriptionId: 1 },
  { unique: true, sparse: true },
);

export const Subscription = model<SubscriptionRecord>(
  'Subscription',
  subscriptionSchema,
);
