'use client';

import { useState } from 'react';
import { useAdminClient } from '@/lib/api/admin-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface MailboxEntry {
  emailAddress: string;
  displayName: string;
  domain: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  imapHost: string;
  imapPort: number;
  imapUsername: string;
  imapPassword: string;
}

const EMPTY_ENTRY: MailboxEntry = {
  emailAddress: '',
  displayName: '',
  domain: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  imapHost: '',
  imapPort: 993,
  imapUsername: '',
  imapPassword: '',
};

export default function BulkImportPage() {
  const api = useAdminClient();
  const [entries, setEntries] = useState<MailboxEntry[]>([{ ...EMPTY_ENTRY }]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; details?: any } | null>(null);

  function updateEntry(index: number, field: keyof MailboxEntry, value: string | number) {
    setEntries((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };

      // Auto-fill domain from email
      if (field === 'emailAddress' && typeof value === 'string' && value.includes('@')) {
        copy[index].domain = value.split('@')[1];
      }

      // Auto-fill SMTP/IMAP usernames from email
      if (field === 'emailAddress' && typeof value === 'string') {
        if (!copy[index].smtpUsername) copy[index].smtpUsername = value;
        if (!copy[index].imapUsername) copy[index].imapUsername = value;
      }

      return copy;
    });
  }

  function addRow() {
    setEntries((prev) => [...prev, { ...EMPTY_ENTRY }]);
  }

  function removeRow(index: number) {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImport() {
    // Validate
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e.emailAddress || !e.displayName || !e.smtpHost || !e.smtpUsername || !e.smtpPassword || !e.imapHost || !e.imapUsername || !e.imapPassword) {
        toast.error(`Row ${i + 1}: Please fill all required fields`);
        return;
      }
    }

    setImporting(true);
    setResult(null);
    try {
      const { ok, data } = await api.post('/api/admin/mailboxes/bulk-import', {
        mailboxes: entries,
      });
      if (ok) {
        setResult(data);
        toast.success(`Imported ${data.created} mailbox${data.created !== 1 ? 'es' : ''}`);
        if (data.created > 0) {
          setEntries([{ ...EMPTY_ENTRY }]);
        }
      } else {
        toast.error(data?.error || 'Import failed');
      }
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Bulk Import Mailboxes</h1>
        <p className="text-sm text-muted-foreground">
          Add new Infraforge mailboxes to the pool. They will start in WARMING status at stage 1.
        </p>
      </div>

      {/* Result */}
      {result && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium">{result.created} created</span>
              {result.skipped > 0 && (
                <span className="text-muted-foreground ml-2">({result.skipped} skipped — already exist)</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mailbox Credentials</CardTitle>
          <CardDescription>
            Fill in SMTP and IMAP credentials for each mailbox. Domain and usernames auto-fill from email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {entries.map((entry, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-4 relative">
              {entries.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRow(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              <div className="text-xs font-medium text-muted-foreground">
                Mailbox {idx + 1}
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Email Address *</Label>
                  <Input
                    placeholder="john@company.com"
                    value={entry.emailAddress}
                    onChange={(e) => updateEntry(idx, 'emailAddress', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Display Name *</Label>
                  <Input
                    placeholder="John Smith"
                    value={entry.displayName}
                    onChange={(e) => updateEntry(idx, 'displayName', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Domain</Label>
                  <Input
                    placeholder="company.com"
                    value={entry.domain}
                    onChange={(e) => updateEntry(idx, 'domain', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* SMTP */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">SMTP (Sending)</p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Host *</Label>
                    <Input
                      placeholder="smtp.infraforge.com"
                      value={entry.smtpHost}
                      onChange={(e) => updateEntry(idx, 'smtpHost', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Port</Label>
                    <Input
                      type="number"
                      value={entry.smtpPort}
                      onChange={(e) => updateEntry(idx, 'smtpPort', parseInt(e.target.value) || 587)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Username *</Label>
                    <Input
                      placeholder="john@company.com"
                      value={entry.smtpUsername}
                      onChange={(e) => updateEntry(idx, 'smtpUsername', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Password *</Label>
                    <Input
                      type="password"
                      value={entry.smtpPassword}
                      onChange={(e) => updateEntry(idx, 'smtpPassword', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* IMAP */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">IMAP (Receiving / Reply Detection)</p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Host *</Label>
                    <Input
                      placeholder="imap.infraforge.com"
                      value={entry.imapHost}
                      onChange={(e) => updateEntry(idx, 'imapHost', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Port</Label>
                    <Input
                      type="number"
                      value={entry.imapPort}
                      onChange={(e) => updateEntry(idx, 'imapPort', parseInt(e.target.value) || 993)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Username *</Label>
                    <Input
                      placeholder="john@company.com"
                      value={entry.imapUsername}
                      onChange={(e) => updateEntry(idx, 'imapUsername', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Password *</Label>
                    <Input
                      type="password"
                      value={entry.imapPassword}
                      onChange={(e) => updateEntry(idx, 'imapPassword', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add Another
            </Button>
            <div className="flex-1" />
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {entries.length} Mailbox{entries.length !== 1 ? 'es' : ''}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
