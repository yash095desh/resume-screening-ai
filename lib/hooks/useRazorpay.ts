// lib/hooks/useRazorpay.ts
'use client';

import { useCallback, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

// Razorpay Checkout options type
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

// Razorpay response from payment modal
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

// Pricing tier for custom credit purchases
export interface PricingTier {
  min: number;
  max: number;
  pricePerCredit: number;
  label: string;
}

// Credit pricing config from backend
export interface CreditPricing {
  tiers: PricingTier[];
  minPurchase: number;
  maxPurchase: number;
  currency: string;
}

// Feature costs from backend
export interface FeatureCosts {
  SCREENING: number;
  SOURCING: number;
  INTERVIEW: number;
  OUTREACH: number;
}

// Subscription plan from backend
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceInRupees: number;
  credits: number;
  billingCycle: string;
  razorpayPlanId: string | null;
}

// Payment record from backend
export interface Payment {
  id: string;
  type: 'CREDIT_PURCHASE' | 'SUBSCRIPTION';
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  creditsPurchased?: number;
  pricePerCredit?: number;
  plan?: SubscriptionPlan;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
}

// Credit balance from backend
export interface CreditBalance {
  credits: number;
}

// Price calculation result
export interface PriceCalculation {
  totalPrice: number;
  pricePerCredit: number;
  tierLabel: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
    };
  }
}

export function useRazorpay() {
  const api = useApiClient();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Get Razorpay key from env
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  /**
   * Check if Razorpay SDK is loaded
   */
  const isRazorpayLoaded = useCallback(() => {
    return typeof window !== 'undefined' && window.Razorpay;
  }, []);

  /**
   * Open Razorpay payment modal
   */
  const openRazorpayModal = useCallback(
    (options: Omit<RazorpayOptions, 'key'>) => {
      if (!isRazorpayLoaded()) {
        toast.error('Payment system is loading. Please try again.');
        return;
      }

      if (!razorpayKeyId) {
        toast.error('Payment system is not configured.');
        return;
      }

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        ...options,
      });
      razorpay.open();
    },
    [isRazorpayLoaded, razorpayKeyId]
  );

  /**
   * Fetch feature costs and pricing tiers
   */
  const fetchFeatureCosts = useCallback(async () => {
    const { data, ok } = await api.get('/api/credits/feature-costs');

    if (ok && data.success) {
      return {
        costs: data.costs as FeatureCosts,
        pricing: data.pricing as CreditPricing,
      };
    }

    return null;
  }, [api]);

  /**
   * Calculate price for a given credit amount
   */
  const calculatePrice = useCallback(
    async (credits: number) => {
      const { data, ok } = await api.post('/api/payments/calculate-price', {
        credits,
      });

      if (ok && data.success) {
        return data.pricing as PriceCalculation;
      }

      return null;
    },
    [api]
  );

  /**
   * Purchase custom credit amount
   */
  const purchaseCredits = useCallback(
    async (creditAmount: number, onSuccess?: (credits: CreditBalance) => void) => {
      if (!isRazorpayLoaded()) {
        toast.error('Payment system is loading. Please try again.');
        return;
      }

      setIsLoading(true);

      try {
        // Step 1: Create order
        const { data, ok } = await api.post('/api/payments/create-order', {
          credits: creditAmount,
        });

        if (!ok || !data.success) {
          throw new Error(data?.error || 'Failed to create order');
        }

        const { orderId, amount, currency, creditDetails } = data;

        // Step 2: Open Razorpay modal
        openRazorpayModal({
          amount,
          currency,
          order_id: orderId,
          name: 'RecruitKar',
          description: `${creditDetails.credits} Credits`,
          image: '/logo.png',
          prefill: {
            name: user?.fullName || '',
            email: user?.primaryEmailAddress?.emailAddress || '',
          },
          theme: {
            color: '#18181b',
          },
          handler: async (response: RazorpayResponse) => {
            // Step 3: Verify payment
            try {
              const verifyResult = await api.post('/api/payments/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyResult.ok && verifyResult.data.success) {
                toast.success(
                  `${verifyResult.data.creditsPurchased} credits added successfully!`
                );
                onSuccess?.(verifyResult.data.newBalance);
              } else {
                toast.error(
                  verifyResult.data?.error || 'Payment verification failed'
                );
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled');
            },
          },
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to initiate payment';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [api, isRazorpayLoaded, openRazorpayModal, user]
  );

  /**
   * Subscribe to a plan
   */
  const subscribeToPlan = useCallback(
    async (planSlug: string, onSuccess?: () => void) => {
      if (!isRazorpayLoaded()) {
        toast.error('Payment system is loading. Please try again.');
        return;
      }

      setIsLoading(true);

      try {
        // Step 1: Create subscription
        const { data, ok } = await api.post('/api/subscriptions/upgrade', {
          planSlug,
        });

        if (!ok || !data.success) {
          throw new Error(data?.error || 'Failed to create subscription');
        }

        // If no payment required (e.g., downgrade to free)
        if (!data.requiresPayment) {
          toast.success(data.message);
          onSuccess?.();
          return;
        }

        const { subscription, payment } = data;

        // Step 2: Open Razorpay modal for subscription
        openRazorpayModal({
          amount: payment.amount,
          currency: payment.currency,
          subscription_id: payment.razorpaySubscriptionId,
          name: 'RecruitKar',
          description: `${subscription.planName} Plan - Monthly`,
          image: '/logo.png',
          prefill: {
            name: user?.fullName || '',
            email: user?.primaryEmailAddress?.emailAddress || '',
          },
          theme: {
            color: '#18181b',
          },
          handler: async (response: RazorpayResponse) => {
            // Step 3: Verify subscription payment
            try {
              const verifyResult = await api.post(
                '/api/subscriptions/verify-payment',
                {
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySubscriptionId: response.razorpay_subscription_id,
                  razorpaySignature: response.razorpay_signature,
                }
              );

              if (verifyResult.ok && verifyResult.data.success) {
                toast.success('Subscription activated successfully!');
                onSuccess?.();
              } else {
                toast.error(
                  verifyResult.data?.error || 'Payment verification failed'
                );
              }
            } catch (error) {
              console.error('Subscription verification error:', error);
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled');
            },
          },
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to initiate subscription';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [api, isRazorpayLoaded, openRazorpayModal, user]
  );

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(
    async (onSuccess?: () => void) => {
      setIsLoading(true);

      try {
        const { data, ok } = await api.post('/api/subscriptions/cancel');

        if (!ok || !data.success) {
          throw new Error(data?.error || 'Failed to cancel subscription');
        }

        toast.success('Subscription cancelled. Access continues until period end.');
        onSuccess?.();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to cancel subscription';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  /**
   * Fetch payment history
   */
  const fetchPaymentHistory = useCallback(
    async (options?: { type?: string; status?: string; limit?: number }) => {
      let endpoint = '/api/payments/history';
      const params = new URLSearchParams();

      if (options?.type) params.set('type', options.type);
      if (options?.status) params.set('status', options.status);
      if (options?.limit) params.set('limit', options.limit.toString());

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const { data, ok } = await api.get(endpoint);

      if (ok && data.success) {
        return {
          payments: data.payments as Payment[],
          count: data.count as number,
        };
      }

      return { payments: [], count: 0 };
    },
    [api]
  );

  /**
   * Fetch subscription status
   */
  const fetchSubscription = useCallback(async () => {
    const { data, ok } = await api.get('/api/subscriptions');

    if (ok && data.success) {
      return {
        subscription: data.subscription,
        billingInfo: data.billingInfo,
      };
    }

    return null;
  }, [api]);

  /**
   * Fetch available plans
   */
  const fetchPlans = useCallback(async () => {
    const { data, ok } = await api.get('/api/plans');

    if (ok && data.success) {
      return data.plans as SubscriptionPlan[];
    }

    return [];
  }, [api]);

  /**
   * Fetch credit balance
   */
  const fetchCreditBalance = useCallback(async () => {
    const { data, ok } = await api.get('/api/credits/balance');

    if (ok) {
      return (data.balance ?? data) as CreditBalance;
    }

    return null;
  }, [api]);

  return {
    isLoading,
    isRazorpayLoaded,
    purchaseCredits,
    subscribeToPlan,
    cancelSubscription,
    fetchFeatureCosts,
    calculatePrice,
    fetchPaymentHistory,
    fetchSubscription,
    fetchPlans,
    fetchCreditBalance,
  };
}
