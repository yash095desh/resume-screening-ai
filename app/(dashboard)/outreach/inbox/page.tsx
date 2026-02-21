'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Inbox as InboxIcon,
  Search,
  Mail,
  MailOpen,
  Send,
  Loader2,
  Reply,
  Paperclip,
  X,
  FileText,
  Download,
  ChevronUp,
  Check,
  CheckCheck,
  Eye,
  MousePointerClick,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { EmailSetupGuard } from '@/components/EmailSetupGuard';
import { StepAttachments, AttachmentMeta } from '@/components/outreach/StepAttachments';
import DOMPurify from 'isomorphic-dompurify';

interface EmailAttachment {
  filename: string;
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

interface Email {
  id: string;
  direction: 'OUTBOUND' | 'INBOUND';
  subject: string;
  bodyHtml: string;
  bodyText: string;
  from: string;
  to: string;
  createdAt: string;
  status: string;
  isRead: boolean;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  deliveredAt?: string;
  attachments?: EmailAttachment[] | null;
}

interface Conversation {
  candidateSequenceId: string;
  candidateName: string;
  candidateEmail: string;
  job: { id: string; title: string };
  sequenceStatus: string;
  lastMessageAt: string;
  hasUnread: boolean;
  emails: Email[];
}

interface Thread {
  candidateSequence: any;
  emails: Email[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  return '📎';
}

function getLatestStatus(email: Email) {
  if (email.status === 'FAILED') return { label: 'Failed', icon: AlertCircle, color: 'text-destructive' };
  if (email.status === 'SCHEDULED') return { label: 'Sending', icon: Clock, color: 'text-muted-foreground' };
  if (email.clickedAt) return { label: 'Clicked', icon: MousePointerClick, color: 'text-green-600' };
  if (email.openedAt) return { label: 'Opened', icon: Eye, color: 'text-blue-500' };
  if (email.deliveredAt) return { label: 'Delivered', icon: CheckCheck, color: 'text-emerald-500' };
  if (email.sentAt || email.status === 'SENT') return { label: 'Sent', icon: Check, color: 'text-muted-foreground' };
  return null;
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img',
      'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class'],
  });
}

function getMessageSnippet(emails: Email[]): string {
  if (!emails || emails.length === 0) return '';
  const lastEmail = emails[emails.length - 1];
  const text = lastEmail.bodyText || lastEmail.bodyHtml?.replace(/<[^>]+>/g, '') || '';
  return text.slice(0, 80).trim() + (text.length > 80 ? '...' : '');
}

export default function InboxPage() {
  const api = useApiClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<AttachmentMeta[]>([]);
  const [sending, setSending] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  async function fetchConversations() {
    try {
      const params: any = {};
      if (filterRead !== 'all') {
        params.isRead = filterRead === 'read';
      }

      const { ok, data } = await api.get(`/api/outreach/inbox?${params}`);
      if (ok) {
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }

  async function fetchThread(candidateSequenceId: string) {
    setThreadLoading(true);
    try {
      const { ok, data } = await api.get(`/api/outreach/inbox/${candidateSequenceId}`);
      if (ok) {
        setThread(data);

        // Mark as read
        await api.put(`/api/outreach/inbox/${candidateSequenceId}/read`);

        // Refresh conversations to update unread count
        fetchConversations();

        // Set reply subject
        if (data.emails && data.emails.length > 0) {
          const lastEmail = data.emails[data.emails.length - 1];
          if (lastEmail.direction === 'INBOUND') {
            const subject = lastEmail.subject;
            if (!subject.startsWith('Re:')) {
              setReplySubject(`Re: ${subject}`);
            } else {
              setReplySubject(subject);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch thread:', error);
      toast.error('Failed to load conversation');
    } finally {
      setThreadLoading(false);
    }
  }

  async function sendReply() {
    if (!selectedConversation || !replySubject || !replyBody) {
      toast.error('Please fill in subject and message');
      return;
    }

    setSending(true);
    try {
      const { ok, data } = await api.post(
        `/api/outreach/inbox/${selectedConversation.candidateSequenceId}/reply`,
        {
          subject: replySubject,
          bodyHtml: `<p>${replyBody.replace(/\n/g, '<br>')}</p>`,
          bodyText: replyBody,
          attachments: replyAttachments.length > 0 ? replyAttachments : undefined,
        }
      );

      if (ok) {
        toast.success('Reply sent (1 credit used)');
        setReplyBody('');
        setReplyAttachments([]);
        setReplyOpen(false);
        setShowAttachments(false);

        // Refresh thread to show the sent reply
        fetchThread(selectedConversation.candidateSequenceId);
      } else {
        const errorMsg = data?.error || 'Failed to send reply';
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    fetchConversations();
  }, [filterRead]);

  useEffect(() => {
    if (selectedConversation) {
      fetchThread(selectedConversation.candidateSequenceId);
      setReplyOpen(false);
      setShowAttachments(false);
      setReplyBody('');
      setReplyAttachments([]);
    }
  }, [selectedConversation?.candidateSequenceId]);

  const filteredConversations = conversations.filter(conv =>
    conv.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <EmailSetupGuard>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Conversation List - Narrower sidebar */}
        <div className="w-80 border-r border-border flex flex-col bg-background">
          {/* Header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">Inbox</h1>
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="bg-background w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm bg-background"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <InboxIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map(conv => (
                  <div
                    key={conv.candidateSequenceId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`px-3 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation?.candidateSequenceId === conv.candidateSequenceId
                        ? 'bg-muted border-l-2 border-primary'
                        : ''
                    }`}
                  >
                    {/* Name and time */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {conv.hasUnread ? (
                          <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <MailOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className={`text-sm font-medium truncate ${
                          conv.hasUnread ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {conv.candidateName}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground ml-2 shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Job title + status on one line */}
                    <div className="flex items-center gap-2 mb-1 ml-5.5">
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {conv.job.title}
                      </span>
                      <Badge variant={
                        conv.sequenceStatus === 'PAUSED' ? 'default' :
                        conv.sequenceStatus === 'COMPLETED' ? 'secondary' :
                        'outline'
                      } className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                        {conv.sequenceStatus}
                      </Badge>
                      {conv.hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    {/* Message snippet */}
                    {conv.emails && conv.emails.length > 0 && (
                      <p className="text-xs text-muted-foreground/70 truncate ml-5.5">
                        {getMessageSnippet(conv.emails)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thread View */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedConversation && thread ? (
            <>
              {/* Thread Header - Compact */}
              <div className="px-6 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold truncate">{selectedConversation.candidateName}</h2>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {selectedConversation.candidateEmail}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedConversation.job.title}</p>
                  </div>
                </div>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {threadLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  thread.emails.map((email, index) => {
                    const status = email.direction === 'OUTBOUND' ? getLatestStatus(email) : null;
                    const isFirstEmail = index === 0;

                    return (
                      <Card key={email.id} className={`${
                        email.direction === 'OUTBOUND'
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card'
                      }`}>
                        <div className="p-4 space-y-2">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {email.direction === 'OUTBOUND' ? 'You' : selectedConversation.candidateName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(email.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {status && (
                              <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                                <status.icon className="w-3 h-3" />
                                <span>{status.label}</span>
                              </div>
                            )}
                          </div>

                          {/* Subject - only on first email */}
                          {isFirstEmail && (
                            <div className="text-sm font-medium">
                              {email.subject}
                            </div>
                          )}

                          {/* Body - sanitized */}
                          <div
                            className="text-sm leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.bodyHtml || email.bodyText || '') }}
                          />

                          {/* Attachments on email */}
                          {email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                              {email.attachments.map((att, attIndex) => (
                                <a
                                  key={attIndex}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs hover:bg-muted/60 transition-colors group"
                                >
                                  <span>{getFileIcon(att.mimeType)}</span>
                                  <span className="font-medium truncate max-w-[150px]">{att.filename}</span>
                                  <span className="text-muted-foreground">{formatFileSize(att.size)}</span>
                                  <Download className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Reply Box - Collapsible */}
              <div className="border-t border-border">
                {!replyOpen ? (
                  /* Collapsed reply bar */
                  <div className="px-4 py-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyOpen(true)}
                      className="gap-2"
                    >
                      <Reply className="w-4 h-4" />
                      Reply
                    </Button>
                    <span className="text-xs text-muted-foreground">1 credit per reply</span>
                  </div>
                ) : (
                  /* Expanded reply editor */
                  <div className="p-4 space-y-3">
                    {/* Collapse button */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Reply</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setReplyOpen(false);
                          setShowAttachments(false);
                        }}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </div>

                    <Input
                      placeholder="Subject"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      className="bg-background h-8 text-sm"
                    />
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={3}
                      className="bg-background resize-none text-sm"
                    />

                    {/* Attachments - toggled via paperclip */}
                    {showAttachments && (
                      <StepAttachments
                        attachments={replyAttachments}
                        onChange={setReplyAttachments}
                      />
                    )}

                    {/* Inline attached files preview (when hidden) */}
                    {!showAttachments && replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {replyAttachments.map((att, i) => (
                          <span key={att.path} className="inline-flex items-center gap-1 text-xs bg-muted rounded px-2 py-1">
                            <Paperclip className="w-3 h-3" />
                            {att.filename}
                            <button
                              type="button"
                              onClick={() => setReplyAttachments(replyAttachments.filter((_, idx) => idx !== i))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={sendReply}
                        disabled={sending || !replySubject || !replyBody}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Send
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAttachments(!showAttachments)}
                        className={showAttachments ? 'text-primary' : ''}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-auto">1 credit per reply</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <InboxIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Select a conversation</p>
                  <p className="text-xs text-muted-foreground">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmailSetupGuard>
  );
}
