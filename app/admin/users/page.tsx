'use client';

import { useEffect, useState } from 'react';
import { useAdminClient } from '@/lib/api/admin-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Crown, CreditCard, Clock, XCircle, Server, UserPlus, Copy,
  Check, Plus, Minus, Activity, Flame, Pause,
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

interface MailboxInfo {
  id: string;
  emailAddress: string;
  status: string;
  warmupStage: number;
  healthScore: number;
  dailyLimit: number;
  emailsSentToday?: number;
  totalEmailsSent?: number;
  assignedAt?: string;
}

type ActionType = 'assign-plan' | 'grant-credits' | 'extend-sub' | 'revoke' | 'mailbox-manage';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Action dialog state
  const [actionUser, setActionUser] = useState<UserRow | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields
  const [formPlanSlug, setFormPlanSlug] = useState('growth');
  const [formDuration, setFormDuration] = useState('30');
  const [formGrantCredits, setFormGrantCredits] = useState(true);
  const [formCredits, setFormCredits] = useState('');
  const [formCreditsMode, setFormCreditsMode] = useState<'add' | 'set'>('set');
  const [formDays, setFormDays] = useState('');
  const [formReason, setFormReason] = useState('');

  // Create user dialog
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createCompany, setCreateCompany] = useState('');

  // Mailbox management dialog
  const [mailboxLoading, setMailboxLoading] = useState(false);
  const [assignedMailboxes, setAssignedMailboxes] = useState<MailboxInfo[]>([]);
  const [availableMailboxes, setAvailableMailboxes] = useState<MailboxInfo[]>([]);

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

  function copyUserId(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openAction(user: UserRow, type: ActionType) {
    setActionUser(user);
    setActionType(type);
    setFormPlanSlug('growth');
    setFormDuration('30');
    setFormGrantCredits(true);
    setFormCredits('');
    setFormCreditsMode('set');
    setFormDays('');
    setFormReason('');

    if (type === 'mailbox-manage') {
      fetchUserMailboxes(user.id);
    }
  }

  function closeAction() {
    setActionUser(null);
    setActionType(null);
    setActionLoading(false);
    setAssignedMailboxes([]);
    setAvailableMailboxes([]);
  }

  // ---- Create User ----

  async function handleCreateUser() {
    if (!createEmail || !createName || !createPassword) return;
    setCreateLoading(true);
    try {
      const { ok, data } = await api.post('/api/admin/create-user', {
        email: createEmail,
        name: createName,
        password: createPassword,
        companyName: createCompany || undefined,
      });
      if (ok) {
        toast.success(`Created user: ${data.user.email}`);
        setShowCreateUser(false);
        setCreateEmail('');
        setCreateName('');
        setCreatePassword('');
        setCreateCompany('');
        fetchUsers();
      } else {
        toast.error(data?.error || 'Failed to create user');
      }
    } catch {
      toast.error('Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  }

  // ---- Assign Plan ----

  async function handleAssignPlan() {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post('/api/admin/assign-plan', {
        userId: actionUser.id,
        planSlug: formPlanSlug,
        durationDays: parseInt(formDuration) || 30,
        grantCredits: formGrantCredits,
        reason: formReason || undefined,
      });
      if (ok) {
        toast.success(`Assigned ${data.plan.name} to ${actionUser.email}${formGrantCredits ? ` (+${data.creditsGranted} credits)` : ' (no credits)'}`);
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

  // ---- Credits ----

  async function handleCredits() {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      const amount = parseInt(formCredits) || 0;
      if (formCreditsMode === 'set') {
        const { ok, data } = await api.post('/api/admin/set-credits', {
          userId: actionUser.id,
          amount,
          reason: formReason || undefined,
        });
        if (ok) {
          toast.success(`Credits set: ${data.previousBalance} → ${data.newBalance}`);
          closeAction();
          fetchUsers();
        } else {
          toast.error(data?.error || 'Failed to set credits');
        }
      } else {
        const { ok, data } = await api.post('/api/admin/grant-credits', {
          userId: actionUser.id,
          amount,
          reason: formReason || undefined,
        });
        if (ok) {
          toast.success(`Added ${data.creditsGranted} credits. Balance: ${data.newBalance}`);
          closeAction();
          fetchUsers();
        } else {
          toast.error(data?.error || 'Failed to grant credits');
        }
      }
    } catch {
      toast.error('Failed to update credits');
    } finally {
      setActionLoading(false);
    }
  }

  // ---- Extend Sub ----

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

  // ---- Revoke ----

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

  // ---- Mailbox Management ----

  async function fetchUserMailboxes(userId: string) {
    setMailboxLoading(true);
    try {
      const { ok, data } = await api.get(`/api/admin/users/${userId}/mailboxes`);
      if (ok) {
        setAssignedMailboxes(data.assigned);
        setAvailableMailboxes(data.available);
      } else {
        toast.error(data?.error || 'Failed to load mailboxes');
      }
    } catch {
      toast.error('Failed to load mailboxes');
    } finally {
      setMailboxLoading(false);
    }
  }

  async function handleAssignMailbox(mailboxId: string) {
    if (!actionUser) return;
    try {
      const { ok, data } = await api.post(`/api/admin/users/${actionUser.id}/mailboxes/assign`, { mailboxId });
      if (ok) {
        toast.success(`Assigned ${data.mailbox}`);
        fetchUserMailboxes(actionUser.id);
        fetchUsers();
      } else {
        toast.error(data?.error || 'Failed to assign mailbox');
      }
    } catch {
      toast.error('Failed to assign mailbox');
    }
  }

  async function handleReleaseMailbox(mailboxId: string) {
    if (!actionUser) return;
    try {
      const { ok, data } = await api.post(`/api/admin/users/${actionUser.id}/mailboxes/release`, { mailboxId });
      if (ok) {
        toast.success(`Released ${data.mailbox}`);
        fetchUserMailboxes(actionUser.id);
        fetchUsers();
      } else {
        toast.error(data?.error || 'Failed to release mailbox');
      }
    } catch {
      toast.error('Failed to release mailbox');
    }
  }

  // ---- Helpers ----

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

  function getStatusIcon(status: string) {
    switch (status) {
      case 'ACTIVE': return <Activity className="h-3 w-3 text-green-500" />;
      case 'WARMING': return <Flame className="h-3 w-3 text-orange-500" />;
      case 'PAUSED': return <Pause className="h-3 w-3 text-red-500" />;
      default: return <XCircle className="h-3 w-3 text-gray-500" />;
    }
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
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => setShowCreateUser(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{u.email}</span>
                          <button
                            onClick={() => copyUserId(u.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title={`Copy ID: ${u.id}`}
                          >
                            {copiedId === u.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
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
                          onClick={() => openAction(u, 'mailbox-manage')}
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

      {/* ======== CREATE USER DIALOG ======== */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Create a new user account (skips email verification).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="text"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Temporary password for the user"
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name (optional)</Label>
              <Input
                value={createCompany}
                onChange={(e) => setCreateCompany(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>Cancel</Button>
            <Button
              onClick={handleCreateUser}
              disabled={createLoading || !createEmail || !createName || !createPassword}
            >
              {createLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======== ASSIGN PLAN DIALOG ======== */}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="grantCredits"
                checked={formGrantCredits}
                onCheckedChange={(checked) => setFormGrantCredits(checked as boolean)}
              />
              <label htmlFor="grantCredits" className="text-sm cursor-pointer">
                Grant plan credits automatically
              </label>
            </div>
            {!formGrantCredits && (
              <p className="text-xs text-muted-foreground">
                Plan will be assigned without adding credits. Use the Credits button to set a custom amount after.
              </p>
            )}
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

      {/* ======== CREDITS DIALOG (Add or Set) ======== */}
      <Dialog open={actionType === 'grant-credits'} onOpenChange={() => closeAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Credits</DialogTitle>
            <DialogDescription>
              Update credits for <strong>{actionUser?.email}</strong>
              <span className="block mt-1 text-xs">
                Current balance: {actionUser?.credits} credits
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={formCreditsMode === 'set' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormCreditsMode('set')}
                  className="flex-1"
                >
                  Set Exact
                </Button>
                <Button
                  variant={formCreditsMode === 'add' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormCreditsMode('add')}
                  className="flex-1"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                {formCreditsMode === 'set' ? 'Set balance to' : 'Credits to add'}
              </Label>
              <Input
                type="number"
                value={formCredits}
                onChange={(e) => setFormCredits(e.target.value)}
                placeholder={formCreditsMode === 'set' ? 'e.g. 1000' : 'e.g. 500'}
                min={0}
              />
              {formCreditsMode === 'set' && formCredits && (
                <p className="text-xs text-muted-foreground">
                  {actionUser?.credits} → {formCredits} credits
                </p>
              )}
              {formCreditsMode === 'add' && formCredits && (
                <p className="text-xs text-muted-foreground">
                  {actionUser?.credits} + {formCredits} = {(actionUser?.credits || 0) + (parseInt(formCredits) || 0)} credits
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="e.g. demo setup, compensation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancel</Button>
            <Button
              onClick={handleCredits}
              disabled={actionLoading || !formCredits || (formCreditsMode === 'add' && parseInt(formCredits) <= 0)}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {formCreditsMode === 'set' ? 'Set Credits' : 'Add Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======== EXTEND SUBSCRIPTION DIALOG ======== */}
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

      {/* ======== REVOKE PLAN DIALOG ======== */}
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

      {/* ======== MAILBOX MANAGEMENT DIALOG ======== */}
      <Dialog open={actionType === 'mailbox-manage'} onOpenChange={() => closeAction()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Mailboxes</DialogTitle>
            <DialogDescription>
              Manage mailboxes for <strong>{actionUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          {mailboxLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Assigned Mailboxes */}
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Assigned ({assignedMailboxes.length})
                </h4>
                {assignedMailboxes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No mailboxes assigned</p>
                ) : (
                  <div className="space-y-2">
                    {assignedMailboxes.map((mb) => (
                      <div key={mb.id} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(mb.status)}
                          <span className="font-mono text-xs">{mb.emailAddress}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            S{mb.warmupStage}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            HP:{mb.healthScore} | {mb.emailsSentToday}/{mb.dailyLimit}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-red-600 hover:text-red-700"
                          onClick={() => handleReleaseMailbox(mb.id)}
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Release
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Pool */}
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Available Pool ({availableMailboxes.length})
                </h4>
                {availableMailboxes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No mailboxes available in pool</p>
                ) : (
                  <div className="space-y-2">
                    {availableMailboxes.map((mb) => (
                      <div key={mb.id} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(mb.status)}
                          <span className="font-mono text-xs">{mb.emailAddress}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            S{mb.warmupStage}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            HP:{mb.healthScore} | Limit:{mb.dailyLimit}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-green-600 hover:text-green-700"
                          onClick={() => handleAssignMailbox(mb.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
