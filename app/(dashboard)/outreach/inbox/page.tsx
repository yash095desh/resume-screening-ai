'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inbox as InboxIcon, Search, Mail, MailOpen, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { EmailSetupGuard } from '@/components/EmailSetupGuard';

interface Email {
  id: string;
  direction: 'OUTBOUND' | 'INBOUND';
  subject: string;
  bodyHtml: string;
  bodyText: string;
  fromEmail: string;
  toEmail: string;
  createdAt: string;
  status: string;
  isRead: boolean;
  openedAt?: string;
  clickedAt?: string;
  deliveredAt?: string;
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
  const [sending, setSending] = useState(false);

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
      const { ok } = await api.post(
        `/api/outreach/inbox/${selectedConversation.candidateSequenceId}/reply`,
        {
          subject: replySubject,
          bodyHtml: `<p>${replyBody.replace(/\n/g, '<br>')}</p>`,
          bodyText: replyBody
        }
      );

      if (ok) {
        toast.success('Reply sent');
        setReplyBody('');

        // Refresh thread
        fetchThread(selectedConversation.candidateSequenceId);
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
    }
  }, [selectedConversation?.candidateSequenceId]);

  const filteredConversations = conversations.filter(conv =>
    conv.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <EmailSetupGuard>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Conversation List */}
        <div className="w-96 border-r border-border flex flex-col bg-background">
          {/* Header */}
          <div className="p-6 border-b border-border space-y-4">
            <h1 className="text-2xl font-bold">Inbox</h1>

            {/* Search - compact spacing */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            {/* Filter */}
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conversations</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <InboxIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
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
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation?.candidateSequenceId === conv.candidateSequenceId
                        ? 'bg-muted border-l-4 border-primary'
                        : ''
                    }`}
                  >
                    {/* Name and time - compact */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {conv.hasUnread ? (
                          <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <MailOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={`font-medium truncate ${
                          conv.hasUnread ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {conv.candidateName}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Job title */}
                    <div className="text-sm text-muted-foreground mb-2 truncate">
                      {conv.job.title}
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        conv.sequenceStatus === 'PAUSED' ? 'default' :
                        conv.sequenceStatus === 'COMPLETED' ? 'secondary' :
                        'outline'
                      } className="text-xs">
                        {conv.sequenceStatus}
                      </Badge>
                      {conv.hasUnread && (
                        <Badge variant="destructive" className="text-xs">New</Badge>
                      )}
                    </div>
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
              {/* Thread Header */}
              <div className="p-6 border-b border-border space-y-1">
                <h2 className="text-xl font-bold">{selectedConversation.candidateName}</h2>
                <p className="text-sm text-muted-foreground">{selectedConversation.candidateEmail}</p>
                <p className="text-sm text-muted-foreground">{selectedConversation.job.title}</p>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {threadLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  thread.emails.map(email => (
                    <Card key={email.id} className={`${
                      email.direction === 'OUTBOUND'
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card'
                    }`}>
                      <div className="p-4 space-y-3">
                        {/* Header - compact */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="font-medium text-sm">
                              {email.direction === 'OUTBOUND' ? 'You' : selectedConversation.candidateName}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {new Date(email.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {email.direction === 'OUTBOUND' && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {email.deliveredAt && <span className="flex items-center gap-1">✓ Delivered</span>}
                              {email.openedAt && <span className="flex items-center gap-1">👁 Opened</span>}
                              {email.clickedAt && <span className="flex items-center gap-1">🖱 Clicked</span>}
                            </div>
                          )}
                        </div>

                        {/* Subject */}
                        <div className="text-sm font-medium">
                          {email.subject}
                        </div>

                        {/* Body */}
                        <div
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: email.bodyHtml || email.bodyText }}
                        />
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Reply Box */}
              <div className="p-6 border-t border-border space-y-3">
                <Input
                  placeholder="Subject"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="bg-background"
                />
                <Textarea
                  placeholder="Type your reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={4}
                  className="bg-background resize-none"
                />
                <Button
                  onClick={sendReply}
                  disabled={sending || !replySubject || !replyBody}
                  className="w-full md:w-auto"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <InboxIcon className="w-16 h-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm text-muted-foreground">
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
