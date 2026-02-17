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
import {
  ShieldBan, Loader2, Trash2, RefreshCw,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface SuppressedEmail {
  id: string;
  email: string;
  reason: string;
  source: string | null;
  createdAt: string;
}

const REASON_CONFIG: Record<string, { label: string; color: string }> = {
  HARD_BOUNCE: { label: 'Hard Bounce', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  SPAM_COMPLAINT: { label: 'Spam Complaint', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  UNSUBSCRIBE: { label: 'Unsubscribe', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  MANUAL: { label: 'Manual', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

export default function SuppressionListPage() {
  const api = useAdminClient();
  const [items, setItems] = useState<SuppressedEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<SuppressedEmail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (reasonFilter !== 'all') params.set('reason', reasonFilter);

      const { ok, data } = await api.get(`/api/admin/suppression-list?${params}`);
      if (ok) {
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast.error('Failed to load suppression list');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [reasonFilter]);

  useEffect(() => {
    fetchData();
  }, [page, reasonFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const { ok, data } = await api.del(
        `/api/admin/suppression-list/${encodeURIComponent(deleteTarget.email)}`
      );
      if (ok) {
        toast.success(`Removed ${deleteTarget.email} from suppression list`);
        setDeleteTarget(null);
        fetchData();
      } else {
        toast.error(data?.error || 'Failed to remove');
      }
    } catch {
      toast.error('Failed to remove email');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppression List</h1>
          <p className="text-sm text-muted-foreground">
            Emails blocked from receiving outreach ({total} total)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Suppressed Emails</CardTitle>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="HARD_BOUNCE">Hard Bounce</SelectItem>
                <SelectItem value="SPAM_COMPLAINT">Spam Complaint</SelectItem>
                <SelectItem value="UNSUBSCRIBE">Unsubscribe</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <ShieldBan className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No suppressed emails found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const cfg = REASON_CONFIG[item.reason] || REASON_CONFIG.MANUAL;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <span className="font-medium text-sm">{item.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Suppression List</DialogTitle>
            <DialogDescription>
              Remove <strong>{deleteTarget?.email}</strong> from the suppression list?
              This email will become eligible to receive outreach again.
              {deleteTarget?.reason && (
                <span className="block mt-1 text-xs">
                  Suppression reason: {REASON_CONFIG[deleteTarget.reason]?.label || deleteTarget.reason}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
