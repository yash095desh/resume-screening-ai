'use client';

import { useEffect, useState } from 'react';
import { useAdminClient } from '@/lib/api/admin-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2, RefreshCw, Search, ChevronLeft, ChevronRight,
  Crown, CreditCard, Clock, XCircle, Server,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  plan: string;
  planSlug: string;
  subscriptionStatus: string;
  periodEnd: string | null;
  credits: number;
  mailboxCount: number;
}

type ActionType = 'assign-plan' | 'grant-credits' | 'extend-sub' | 'revoke' | 'mailbox-count';

export default function UsersPage() {
  const api = useAdminClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  // Action dialog state
  const [actionUser, setActionUser] = useState<UserRow | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields for different actions
  const [formPlanSlug, setFormPlanSlug] = useState('growth');
  const [formDuration, setFormDuration] = useState('30');
  const [formCredits, setFormCredits] = useState('');
  const [formDays, setFormDays] = useState('');
  const [formMailboxCount, setFormMailboxCount] = useState('');
  const [formReason, setFormReason] = useState('');

  async function fetchUsers() {
    setLoading(true);
    try {
      let endpoint = `/api/admin/users?page=${page}&limit=50`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      if (planFilter !== 'all') endpoint += `&planSlug=${planFilter}`;

      const { ok, data } = await api.get(endpoint);
      if (ok) {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data?.error || 'Failed to load users');
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [page, search, planFilter]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput);
  }

  function openAction(user: UserRow, type: ActionType) {
    setActionUser(user);
    setActionType(type);
    setFormPlanSlug('growth');
    setFormDuration('30');
    setFormCredits('');
    setFormDays('');
    setFormMailboxCount(String(user.mailboxCount));
    setFormReason('');
  }

  function closeAction() {
    setActionUser(null);
    setActionType(null);
    setActionLoading(false);
  }

  async function handleAssignPlan() {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post('/api/admin/assign-plan', {
        userId: actionUser.id,
        planSlug: formPlanSlug,
        durationDays: parseInt(formDuration) || 30,
        reason: formReason || undefined,
      });
      if (ok) {
        toast.success(`Assigned ${data.plan.name} to ${actionUser.email}`);
        closeAction();
        fetchUsers();
      } else {
        toast.error(data?.error || 'Failed to assign plan');
      }
    } catch {
      toast.error('Failed to assign plan');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGrantCredits() {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post('/api/admin/grant-credits', {
        userId: actionUser.id,
        amount: parseInt(formCredits) || 0,
        reason: formReason || undefined,
      });
      if (ok) {
        toast.success(`Granted ${data.creditsGranted} credits. New balance: ${data.newBalance}`);
        closeAction();
        fetchUsers();
      } else {
        toast.error(data?.error || 'Failed to grant credits');
      }
    } catch {
      toast.error('Failed to grant credits');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExtendSub() {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post('/api/admin/extend-subscription', {
        userId: actionUser.id,
        days: parseInt(formDays) || 0,
        reason: formReason || undefined,
      });
      if (ok) {
        toast.success(`Extended by ${data.daysAdded} days until ${new Date(data.newEnd).toLocaleDateString()}`);
        closeAction();
        fetchUsers();
      } else {
        toast.error(data?.error || 'Failed to extend subscription');
      }
    } catch {
      toast.error('Failed to extend subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevoke() {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post('/api/admin/revoke-plan', {
        userId: actionUser.id,
        reason: formReason || undefined,
      });
      if (ok) {
        toast.success(`Revoked plan. Released ${data.mailboxesReleased} mailboxes.`);
        closeAction();
        fetchUsers();
      } else {
        toast.error(data?.error || 'Failed to revoke plan');
      }
    } catch {
      toast.error('Failed to revoke plan');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMailboxCount() {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post('/api/admin/assign-mailbox-count', {
        userId: actionUser.id,
        count: parseInt(formMailboxCount) || 0,
        reason: formReason || undefined,
      });
      if (ok) {
        toast.success(`Mailboxes: ${data.previousCount} → ${data.newCount} (${data.result.action})`);
        closeAction();
        fetchUsers();
      } else {
        toast.error(data?.error || 'Failed to update mailbox count');
      }
    } catch {
      toast.error('Failed to update mailbox count');
    } finally {
      setActionLoading(false);
    }
  }

  function getPlanBadge(plan: string, status: string) {
    if (status === 'CANCELLED' || plan === 'Free') {
      return <Badge variant="secondary" className="text-xs">Free</Badge>;
    }
    const colors: Record<string, string> = {
      Starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Growth: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      Enterprise: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return (
      <Badge variant="secondary" className={`text-xs ${colors[plan] || ''}`}>
        {plan}
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            {total} total users
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Input
            placeholder="Search by email or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Mailboxes</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{u.email}</div>
                        {u.name && (
                          <div className="text-xs text-muted-foreground">{u.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(u.plan, u.subscriptionStatus)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">{u.credits}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{u.mailboxCount}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {u.periodEnd
                          ? new Date(u.periodEnd).toLocaleDateString()
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openAction(u, 'assign-plan')}
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          Plan
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openAction(u, 'grant-credits')}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Credits
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openAction(u, 'extend-sub')}
                          disabled={u.subscriptionStatus === 'none' || u.planSlug === 'free'}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Extend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openAction(u, 'mailbox-count')}
                        >
                          <Server className="h-3 w-3 mr-1" />
                          Mailboxes
                        </Button>
                        {u.planSlug !== 'free' && u.subscriptionStatus !== 'none' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:text-red-700"
                            onClick={() => openAction(u, 'revoke')}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Assign Plan Dialog */}
      <Dialog open={actionType === 'assign-plan'} onOpenChange={() => closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Plan</DialogTitle>
            <DialogDescription>
              Assign a plan to <strong>{actionUser?.email}</strong>
              {actionUser?.plan !== 'Free' && (
                <span className="block mt-1 text-xs">
                  Current plan: {actionUser?.plan}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={formPlanSlug} onValueChange={setFormPlanSlug}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (days)</Label>
              <Input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="e.g. demo access, partner deal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button onClick={handleAssignPlan} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Assign Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Credits Dialog */}
      <Dialog open={actionType === 'grant-credits'} onOpenChange={() => closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Credits</DialogTitle>
            <DialogDescription>
              Add credits to <strong>{actionUser?.email}</strong>
              <span className="block mt-1 text-xs">
                Current balance: {actionUser?.credits} credits
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Credits to add</Label>
              <Input
                type="number"
                value={formCredits}
                onChange={(e) => setFormCredits(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="e.g. compensation, demo top-up"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button
              onClick={handleGrantCredits}
              disabled={actionLoading || !formCredits || parseInt(formCredits) <= 0}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Grant Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={actionType === 'extend-sub'} onOpenChange={() => closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Extend subscription for <strong>{actionUser?.email}</strong>
              <span className="block mt-1 text-xs">
                Current plan: {actionUser?.plan} | Expires: {actionUser?.periodEnd ? new Date(actionUser.periodEnd).toLocaleDateString() : 'N/A'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Days to add</Label>
              <Input
                type="number"
                value={formDays}
                onChange={(e) => setFormDays(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="e.g. goodwill extension"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button
              onClick={handleExtendSub}
              disabled={actionLoading || !formDays || parseInt(formDays) <= 0}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Plan Dialog */}
      <Dialog open={actionType === 'revoke'} onOpenChange={() => closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Plan</DialogTitle>
            <DialogDescription>
              Downgrade <strong>{actionUser?.email}</strong> to Free plan.
              This will cancel their subscription, release mailboxes, and reset credits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="e.g. abuse, refund"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Revoke Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Mailbox Count Dialog */}
      <Dialog open={actionType === 'mailbox-count'} onOpenChange={() => closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Mailbox Count</DialogTitle>
            <DialogDescription>
              Override mailbox count for <strong>{actionUser?.email}</strong>
              <span className="block mt-1 text-xs">
                Current: {actionUser?.mailboxCount} mailboxes
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Desired mailbox count</Label>
              <Input
                type="number"
                value={formMailboxCount}
                onChange={(e) => setFormMailboxCount(e.target.value)}
                placeholder="e.g. 5"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="e.g. custom allocation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button
              onClick={handleMailboxCount}
              disabled={actionLoading || formMailboxCount === ''}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
