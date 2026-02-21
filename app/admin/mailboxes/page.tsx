'use client';

import { useEffect, useState } from 'react';
import { useAdminClient } from '@/lib/api/admin-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Server, Activity, AlertTriangle, Pause,
  Flame, XCircle, Loader2, Play, UserPlus, UserMinus,
  RefreshCw, ArrowUpCircle,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Mailbox {
  id: string;
  emailAddress: string;
  smtpHost: string;
  status: string;
  warmupStage: number;
  dailyLimit: number;
  emailsSentToday: number;
  activeSendingDays: number;
  preWarmed: boolean;
  healthScore: number;
  bounceRate: number;
  totalEmailsSent: number;
  totalBounced: number;
  totalComplaints: number;
  lastBounceAt: string | null;
  pausedAt: string | null;
  pausedReason: string | null;
  assignedUserId: string | null;
  createdAt: string;
}

interface PoolStatus {
  total: number;
  assigned: number;
  available: number;
  pendingRelease: number;
  paused: number;
  burned: number;
  byStatus?: Record<string, number>;
  byDomain?: Record<string, { total: number; active: number; paused: number }>;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  ACTIVE: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <Activity className="h-3 w-3" /> },
  WARMING: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <Flame className="h-3 w-3" /> },
  PAUSED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <Pause className="h-3 w-3" /> },
  BURNED: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: <XCircle className="h-3 w-3" /> },
};

export default function MailboxDashboardPage() {
  const api = useAdminClient();
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Action dialogs
  const [unpauseTarget, setUnpauseTarget] = useState<Mailbox | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Mailbox | null>(null);
  const [reassignUserId, setReassignUserId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Set stage dialog
  const [stageTarget, setStageTarget] = useState<Mailbox | null>(null);
  const [stageValue, setStageValue] = useState('4');

  async function fetchData() {
    setLoading(true);
    try {
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const [mbRes, poolRes] = await Promise.all([
        api.get(`/api/admin/mailboxes${statusParam}`),
        api.get('/api/admin/pool-status'),
      ]);
      if (mbRes.ok) setMailboxes(mbRes.data.mailboxes);
      if (poolRes.ok) setPoolStatus(poolRes.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function handleUnpause() {
    if (!unpauseTarget) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post(`/api/admin/mailboxes/${unpauseTarget.id}/unpause`);
      if (ok) {
        toast.success(`Unpaused ${unpauseTarget.emailAddress}`);
        setUnpauseTarget(null);
        fetchData();
      } else {
        toast.error(data?.error || 'Failed to unpause');
      }
    } catch {
      toast.error('Failed to unpause mailbox');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReassign(release: boolean) {
    if (!reassignTarget) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post(
        `/api/admin/mailboxes/${reassignTarget.id}/reassign`,
        { userId: release ? null : reassignUserId || null }
      );
      if (ok) {
        toast.success(
          release
            ? `Released ${reassignTarget.emailAddress} to pool`
            : `Assigned ${reassignTarget.emailAddress} to user`
        );
        setReassignTarget(null);
        setReassignUserId('');
        fetchData();
      } else {
        toast.error(data?.error || 'Failed to reassign');
      }
    } catch {
      toast.error('Failed to reassign mailbox');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSetStage() {
    if (!stageTarget) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.post(`/api/admin/mailboxes/${stageTarget.id}/set-stage`, {
        stage: parseInt(stageValue),
      });
      if (ok) {
        toast.success(`Set ${stageTarget.emailAddress} to stage ${data.updated.stage}, limit ${data.updated.dailyLimit}`);
        setStageTarget(null);
        fetchData();
      } else {
        toast.error(data?.error || 'Failed to set stage');
      }
    } catch {
      toast.error('Failed to set stage');
    } finally {
      setActionLoading(false);
    }
  }

  function getHealthColor(score: number) {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mailbox Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage your mailbox pool</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Pool Stats Cards */}
      {poolStatus && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold">{poolStatus.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-500" /> Assigned
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-green-600">{poolStatus.assigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Server className="h-3 w-3 text-blue-500" /> Available
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-blue-600">{poolStatus.available}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" /> Warming
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-orange-600">
                {poolStatus.byStatus?.WARMING ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" /> Paused
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-red-600">{poolStatus.paused}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <XCircle className="h-3 w-3 text-gray-500" /> Burned
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-gray-500">{poolStatus.burned}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter & Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Mailboxes</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="WARMING">Warming</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="BURNED">Burned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : mailboxes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No mailboxes found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Today</TableHead>
                  <TableHead>Bounce</TableHead>
                  <TableHead>Total Sent</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mailboxes.map((mb) => {
                  const cfg = STATUS_CONFIG[mb.status] || STATUS_CONFIG.ACTIVE;
                  return (
                    <TableRow key={mb.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{mb.emailAddress}</div>
                          <div className="text-xs text-muted-foreground">{mb.smtpHost}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs gap-1 ${cfg.color}`}>
                          {cfg.icon}
                          {mb.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{mb.warmupStage}/4</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium text-sm ${getHealthColor(mb.healthScore)}`}>
                          {mb.healthScore}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {mb.emailsSentToday}/{mb.dailyLimit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${mb.bounceRate > 5 ? 'text-red-600 font-medium' : ''}`}>
                          {mb.bounceRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{mb.totalEmailsSent}</span>
                      </TableCell>
                      <TableCell>
                        {mb.assignedUserId ? (
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {mb.assignedUserId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pool</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setStageTarget(mb);
                              setStageValue(String(mb.warmupStage));
                            }}
                          >
                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                            Stage
                          </Button>
                          {mb.status === 'PAUSED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setUnpauseTarget(mb)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Unpause
                            </Button>
                          )}
                          {mb.assignedUserId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setReassignTarget(mb);
                                setReassignUserId('');
                              }}
                            >
                              <UserMinus className="h-3 w-3 mr-1" />
                              Release
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setReassignTarget(mb);
                                setReassignUserId('');
                              }}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Unpause Dialog */}
      <Dialog open={!!unpauseTarget} onOpenChange={() => setUnpauseTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpause Mailbox</DialogTitle>
            <DialogDescription>
              Unpause <strong>{unpauseTarget?.emailAddress}</strong>?
              {unpauseTarget?.pausedReason && (
                <span className="block mt-1 text-xs">
                  Paused reason: {unpauseTarget.pausedReason}
                </span>
              )}
              Health score will be set to 70 (partial recovery).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnpauseTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleUnpause} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Unpause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={!!reassignTarget} onOpenChange={() => setReassignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reassignTarget?.assignedUserId ? 'Release Mailbox' : 'Assign Mailbox'}
            </DialogTitle>
            <DialogDescription>
              {reassignTarget?.assignedUserId
                ? `Release ${reassignTarget?.emailAddress} back to the pool?`
                : `Assign ${reassignTarget?.emailAddress} to a user.`}
            </DialogDescription>
          </DialogHeader>
          {!reassignTarget?.assignedUserId && (
            <Input
              placeholder="User ID"
              value={reassignUserId}
              onChange={(e) => setReassignUserId(e.target.value)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleReassign(!!reassignTarget?.assignedUserId)}
              disabled={actionLoading || (!reassignTarget?.assignedUserId && !reassignUserId)}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {reassignTarget?.assignedUserId ? 'Release to Pool' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Stage Dialog */}
      <Dialog open={!!stageTarget} onOpenChange={() => setStageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Warmup Stage</DialogTitle>
            <DialogDescription>
              Change warmup stage for <strong>{stageTarget?.emailAddress}</strong>
              <span className="block mt-1 text-xs">
                Current: Stage {stageTarget?.warmupStage}/4, Limit: {stageTarget?.dailyLimit}/day
                {stageTarget?.preWarmed && ' (pre-warmed)'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select value={stageValue} onValueChange={setStageValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Stage 1 (5/day)</SelectItem>
                <SelectItem value="2">Stage 2 (10/day)</SelectItem>
                <SelectItem value="3">Stage 3 (20/day)</SelectItem>
                <SelectItem value="4">Stage 4 (30/day)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Also sets activeSendingDays so the cron won't revert this change.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageTarget(null)}>Cancel</Button>
            <Button onClick={handleSetStage} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Set Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
