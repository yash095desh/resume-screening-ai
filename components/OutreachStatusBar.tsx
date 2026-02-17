'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Flame,
} from 'lucide-react';

interface StatusData {
  status: string;
  canSendNow: boolean;
  dailyEmailLimit: number;
  emailsSentToday: number;
  emailsRemaining: number;
  warmupProgress: number;
  isWarmupComplete: boolean;
  mailboxCapacity?: {
    totalDailyLimit: number;
    totalSentToday: number;
    totalRemaining: number;
    mailboxCount: number;
  };
  queue?: {
    pendingStep1: number;
    pendingFollowups: number;
    totalPending: number;
    estimatedDaysToComplete: number;
  };
}

export function OutreachStatusBar() {
  const api = useApiClient();
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { ok, data: d } = await api.get('/api/user-email-status');
        if (ok) setData(d);
      } catch {
        // silently fail — bar just won't show
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading sending status...</span>
      </div>
    );
  }

  if (!data || data.status === 'not_setup') return null;

  const mailboxCount = data.mailboxCapacity?.mailboxCount ?? 0;
  const dailyLimit = data.dailyEmailLimit;
  const sentToday = data.emailsSentToday;
  const remaining = data.emailsRemaining;
  const queueTotal = data.queue?.totalPending ?? 0;
  const estDays = data.queue?.estimatedDaysToComplete ?? 0;
  const usagePercent = dailyLimit > 0 ? Math.round((sentToday / dailyLimit) * 100) : 0;

  // Determine bar color
  const isAtCapacity = remaining === 0 && dailyLimit > 0;
  const isWarming = data.status === 'warming_up';
  const isPaused = data.status === 'paused';

  return (
    <div className={`flex items-center gap-4 px-4 py-2 border-b text-xs ${
      isPaused ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
      isAtCapacity ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900' :
      'bg-muted/30'
    }`}>
      {/* Mailbox status */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Mail className="h-3 w-3" />
        <span className="font-medium">{mailboxCount} mailbox{mailboxCount !== 1 ? 'es' : ''}</span>
        {isPaused ? (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Paused</Badge>
        ) : isWarming ? (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            <Flame className="h-2.5 w-2.5 mr-0.5" />
            Warming {data.warmupProgress}%
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-300">
            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
            Ready
          </Badge>
        )}
      </div>

      {/* Separator */}
      <div className="h-3 w-px bg-border flex-shrink-0" />

      {/* Daily capacity */}
      <div className="flex items-center gap-2 flex-shrink-0 min-w-[180px]">
        <span className="text-muted-foreground">Today:</span>
        <div className="flex items-center gap-1.5 flex-1">
          <Progress
            value={usagePercent}
            className="h-1.5 w-20"
          />
          <span className={`font-medium ${isAtCapacity ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
            {sentToday}/{dailyLimit}
          </span>
        </div>
        {isAtCapacity && (
          <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
        )}
      </div>

      {/* Separator */}
      <div className="h-3 w-px bg-border flex-shrink-0" />

      {/* Queue */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Queue:</span>
        <span className="font-medium">{queueTotal} emails</span>
        {estDays > 1 && (
          <span className="text-muted-foreground">(~{estDays}d)</span>
        )}
      </div>
    </div>
  );
}
