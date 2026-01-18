'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  Mail,
  Send,
  Eye,
  MousePointer,
  Reply,
  XCircle,
} from 'lucide-react';

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalSteps: number;
  createdAt: string;
  stats: {
    totalEnrolled: number;
    totalEmails: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  };
}

export default function SequencesPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSequences();
  }, []);

  async function fetchSequences() {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/sequences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sequences');
      }

      const data = await response.json();
      setSequences(data.sequences);
    } catch (err: any) {
      console.error('Error fetching sequences:', err);
      setError(err.message || 'Failed to load sequences');
    } finally {
      setLoading(false);
    }
  }

  async function toggleSequenceStatus(sequenceId: string, isActive: boolean) {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/sequences/${sequenceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sequence');
      }

      await fetchSequences();
    } catch (err: any) {
      console.error('Error toggling sequence:', err);
      alert(err.message || 'Failed to update sequence');
    }
  }

  async function duplicateSequence(sequenceId: string) {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/sequences/${sequenceId}/duplicate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate sequence');
      }

      await fetchSequences();
    } catch (err: any) {
      console.error('Error duplicating sequence:', err);
      alert(err.message || 'Failed to duplicate sequence');
    }
  }

  async function deleteSequence(sequenceId: string) {
    if (!confirm('Are you sure you want to delete this sequence?')) {
      return;
    }

    try {
      setDeletingId(sequenceId);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/sequences/${sequenceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete sequence');
      }

      await fetchSequences();
    } catch (err: any) {
      console.error('Error deleting sequence:', err);
      alert(err.message || 'Failed to delete sequence');
    } finally {
      setDeletingId(null);
    }
  }

  function calculateOpenRate(stats: Sequence['stats']): string {
    if (stats.sent === 0) return '0%';
    return `${Math.round((stats.opened / stats.sent) * 100)}%`;
  }

  function calculateReplyRate(stats: Sequence['stats']): string {
    if (stats.sent === 0) return '0%';
    return `${Math.round((stats.replied / stats.sent) * 100)}%`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <h1 className="text-4xl font-bold">Email Sequences</h1>
        <p className="text-lg text-muted-foreground">
          Create and manage automated email outreach sequences
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/outreach/sequences/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
        </div>
      </div>

      {/* Sequences Table */}
      {sequences.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No sequences yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first email sequence to start automating outreach
          </p>
          <Button onClick={() => router.push('/outreach/sequences/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Sequence
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Steps</TableHead>
                <TableHead className="text-center">Enrolled</TableHead>
                <TableHead className="text-center">Sent</TableHead>
                <TableHead className="text-center">Open Rate</TableHead>
                <TableHead className="text-center">Reply Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.map((sequence) => (
                <TableRow
                  key={sequence.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/outreach/sequences/${sequence.id}`)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{sequence.name}</div>
                      {sequence.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {sequence.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sequence.isActive ? 'default' : 'secondary'}>
                      {sequence.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{sequence.totalSteps}</TableCell>
                  <TableCell className="text-center">
                    {sequence.stats.totalEnrolled}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Send className="h-3 w-3 text-muted-foreground" />
                      <span>{sequence.stats.sent}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span>{calculateOpenRate(sequence.stats)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Reply className="h-3 w-3 text-muted-foreground" />
                      <span>{calculateReplyRate(sequence.stats)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/outreach/sequences/${sequence.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSequenceStatus(sequence.id, sequence.isActive);
                          }}
                        >
                          {sequence.isActive ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSequence(sequence.id);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={deletingId === sequence.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSequence(sequence.id);
                          }}
                        >
                          {deletingId === sequence.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
