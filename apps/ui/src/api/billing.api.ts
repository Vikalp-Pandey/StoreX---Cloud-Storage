import { api } from '@/lib/axios';

export type PaidPlan = 'pro' | 'ultra';

export interface BillingStatus {
  billingReady: boolean;
  plan: 'free' | PaidPlan;
  subscription: null | {
    plan: PaidPlan;
    amount: number;
    currency: string;
    status: string;
    hasSubscription: boolean;
  };
}

export const billingApi = {
  current: async () =>
    (await api.get<BillingStatus>('/billing/subscription')).data,
  checkout: async (plan: PaidPlan) =>
    (await api.post<{ url: string }>('/billing/checkout', { plan })).data.url,
  portal: async () =>
    (await api.post<{ url: string }>('/billing/portal')).data.url,
};
