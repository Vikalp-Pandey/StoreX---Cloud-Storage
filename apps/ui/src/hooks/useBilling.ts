import { useMutation, useQuery } from '@tanstack/react-query';
import { billingApi, type PaidPlan } from '@/api/billing.api';

export function useBillingStatus(pollAfterCheckout = false) {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: billingApi.current,
    refetchInterval: (query) =>
      pollAfterCheckout && query.state.data?.plan === 'free' ? 3000 : false,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: (plan: PaidPlan) => billingApi.checkout(plan),
  });
}

export function useBillingPortal() {
  return useMutation({ mutationFn: billingApi.portal });
}
