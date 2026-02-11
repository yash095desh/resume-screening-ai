'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRazorpay, Payment } from '@/lib/hooks/useRazorpay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  COMPLETED: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  PENDING: { variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  PROCESSING: { variant: 'secondary', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  FAILED: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  REFUNDED: { variant: 'secondary', icon: <AlertCircle className="h-3 w-3" /> },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  CREDIT_PURCHASE: <CreditCard className="h-4 w-4" />,
  SUBSCRIPTION: <Crown className="h-4 w-4" />,
};

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { fetchPaymentHistory } = useRazorpay();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Fetch payment history
  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      try {
        const options: { type?: string; status?: string; limit?: number } = { limit: 50 };
        if (typeFilter !== 'all') options.type = typeFilter;
        if (statusFilter !== 'all') options.status = statusFilter;

        const result = await fetchPaymentHistory(options);
        setPayments(result.payments);
        setTotalCount(result.count);
      } catch (error) {
        console.error('Error loading payment history:', error);
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  // Format price
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format datetime
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get payment description
  const getPaymentDescription = (payment: Payment) => {
    if (payment.type === 'CREDIT_PURCHASE' && payment.creditsPurchased) {
      const rate = payment.pricePerCredit
        ? ` at ${formatPrice(payment.pricePerCredit)}/credit`
        : '';
      return `Purchased ${payment.creditsPurchased} credits${rate}`;
    }
    if (payment.type === 'SUBSCRIPTION' && payment.plan) {
      return `${payment.plan.name} Plan - Monthly`;
    }
    return payment.type === 'CREDIT_PURCHASE' ? 'Credit Purchase' : 'Subscription Payment';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/settings/billing')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Payment History</h2>
          <p className="text-muted-foreground">
            View all your past transactions and payment details
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CREDIT_PURCHASE">Credit Purchase</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Showing ${payments.length} of ${totalCount} payments`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Payments Found</h3>
              <p className="text-muted-foreground">
                {typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your payment history will appear here'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {TYPE_ICONS[payment.type]}
                        <span className="text-sm">
                          {payment.type === 'CREDIT_PURCHASE' ? 'Credit' : 'Subscription'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getPaymentDescription(payment)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGES[payment.status]?.variant || 'outline'}>
                        <span className="flex items-center gap-1">
                          {STATUS_BADGES[payment.status]?.icon}
                          {payment.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Transaction information and payment details
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium flex items-center gap-2">
                    {TYPE_ICONS[selectedPayment.type]}
                    {selectedPayment.type === 'CREDIT_PURCHASE' ? 'Credit Purchase' : 'Subscription'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={STATUS_BADGES[selectedPayment.status]?.variant || 'outline'}>
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{formatPrice(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Currency</p>
                  <p className="font-medium">{selectedPayment.currency}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Description</p>
                  <p className="font-medium">{getPaymentDescription(selectedPayment)}</p>
                </div>

                {selectedPayment.creditsPurchased && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Credits Purchased</p>
                      <p className="font-medium">{selectedPayment.creditsPurchased} credits</p>
                    </div>
                    {selectedPayment.pricePerCredit && (
                      <div>
                        <p className="text-muted-foreground text-sm">Rate</p>
                        <p className="font-medium">{formatPrice(selectedPayment.pricePerCredit)}/credit</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-muted-foreground text-sm">Created</p>
                  <p className="font-medium">{formatDateTime(selectedPayment.createdAt)}</p>
                </div>

                {selectedPayment.completedAt && (
                  <div>
                    <p className="text-muted-foreground text-sm">Completed</p>
                    <p className="font-medium">{formatDateTime(selectedPayment.completedAt)}</p>
                  </div>
                )}

                {selectedPayment.failedAt && (
                  <div>
                    <p className="text-muted-foreground text-sm">Failed</p>
                    <p className="font-medium">{formatDateTime(selectedPayment.failedAt)}</p>
                  </div>
                )}
              </div>

              {selectedPayment.razorpayPaymentId && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm">Razorpay Payment ID</p>
                  <p className="font-mono text-sm">{selectedPayment.razorpayPaymentId}</p>
                </div>
              )}

              {selectedPayment.errorMessage && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm">Error</p>
                  <p className="text-destructive text-sm">
                    {selectedPayment.errorCode && `[${selectedPayment.errorCode}] `}
                    {selectedPayment.errorMessage}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
