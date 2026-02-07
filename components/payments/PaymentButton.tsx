'use client';

import { ComponentProps, useState } from 'react';
import { useRazorpay, CreditBalance } from '@/lib/hooks/useRazorpay';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Zap } from 'lucide-react';

type ButtonProps = ComponentProps<typeof Button>;

interface PaymentButtonProps extends Omit<ButtonProps, 'onClick'> {
  packageId?: string;
  planSlug?: string;
  onSuccess?: (balance?: CreditBalance) => void;
  children?: React.ReactNode;
}

/**
 * PaymentButton component for initiating Razorpay payments
 *
 * Usage for credit package purchase:
 * <PaymentButton packageId="pkg_123" onSuccess={handleSuccess}>
 *   Buy 50 Credits
 * </PaymentButton>
 *
 * Usage for subscription upgrade:
 * <PaymentButton planSlug="pro" onSuccess={handleSuccess}>
 *   Upgrade to Pro
 * </PaymentButton>
 */
export function PaymentButton({
  packageId,
  planSlug,
  onSuccess,
  children,
  disabled,
  ...props
}: PaymentButtonProps) {
  const { purchaseCreditPackage, subscribeToPlan, isLoading } = useRazorpay();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    try {
      if (packageId) {
        await purchaseCreditPackage(packageId, (balance) => {
          onSuccess?.(balance);
        });
      } else if (planSlug) {
        await subscribeToPlan(planSlug, () => {
          onSuccess?.();
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isProcessing = loading || isLoading;

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      {...props}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children || (
          <>
            {packageId ? (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Buy Now
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Upgrade
              </>
            )}
          </>
        )
      )}
    </Button>
  );
}
