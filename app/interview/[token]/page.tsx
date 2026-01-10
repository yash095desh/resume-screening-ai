'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Briefcase,
  User,
  Video
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface InterviewData {
  id: string;
  status: string;
  linkExpiresAt: string;
  duration?: number;
  candidate?: {
    name: string;
    email: string;
  };
  linkedInCandidate?: {
    fullName: string;
    email: string;
  };
  job?: {
    title: string;
    description: string;
  };
  sourcingJob?: {
    jobTitle: string;
    rawJobDescription: string;
  };
  vapiAssistantId: string;
}

export default function PublicInterviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    validateToken();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [token]);

  async function validateToken() {
    setLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/interview-link/${token}`);

      if (res.status === 404) {
        setError('Invalid interview link. Please check your email for the correct link.');
        return;
      }

      if (res.status === 410) {
        const data = await res.json();
        setError(data.error || 'This interview link has expired or is no longer available.');
        return;
      }

      if (!res.ok) {
        setError('Failed to load interview details. Please try again later.');
        return;
      }

      const data = await res.json();
      setInterview(data);

      // Initialize Vapi
      const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      if (!vapiPublicKey) {
        setError('Interview system not configured. Please contact support.');
        return;
      }

      vapiRef.current = new Vapi(vapiPublicKey);

      // Setup Vapi event listeners
      vapiRef.current.on('call-start', handleCallStart);
      vapiRef.current.on('call-end', handleCallEnd);
      vapiRef.current.on('speech-start', () => console.log('Speech started'));
      vapiRef.current.on('speech-end', () => console.log('Speech ended'));
      vapiRef.current.on('error', (error: any) => {
        console.error('Vapi error:', error);
        setError('An error occurred during the interview. Please try again.');
        setCallStatus('ended');
      });

    } catch (err) {
      console.error('Error validating token:', err);
      setError('Failed to connect to interview service. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCallStart() {
    console.log('Call started');
    setCallStatus('active');

    // Start duration timer
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Notify backend
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/api/interview-link/${token}/start`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error notifying backend of call start:', error);
    }
  }

  async function handleCallEnd() {
    console.log('Call ended');
    setCallStatus('ended');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Notify backend
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/api/interview-link/${token}/complete`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error notifying backend of call end:', error);
    }
  }

  async function startInterview() {
    if (!vapiRef.current || !interview) return;

    setCallStatus('connecting');
    setError(null);

    try {
      await vapiRef.current.start(interview.vapiAssistantId);
    } catch (err: any) {
      console.error('Error starting interview:', err);
      setError('Failed to start interview. Please check your microphone permissions.');
      setCallStatus('idle');
    }
  }

  async function endInterview() {
    if (!vapiRef.current) return;

    try {
      vapiRef.current.stop();
    } catch (err) {
      console.error('Error ending interview:', err);
    }

    setCallStatus('ended');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }

  function toggleMute() {
    if (!vapiRef.current) return;

    const newMutedState = !isMuted;
    vapiRef.current.setMuted(newMutedState);
    setIsMuted(newMutedState);
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getCandidateName(): string {
    if (!interview) return '';
    return interview.candidate?.name || interview.linkedInCandidate?.fullName || 'Candidate';
  }

  function getJobTitle(): string {
    if (!interview) return '';
    return interview.job?.title || interview.sourcingJob?.jobTitle || 'Position';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-muted-foreground">Loading interview...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="mt-4 text-xl font-semibold">Unable to Load Interview</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const isExpired = new Date(interview.linkExpiresAt) < new Date();
  const hoursUntilExpiry = (new Date(interview.linkExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Interview</h1>
          <p className="mt-2 text-muted-foreground">
            Please ensure you're in a quiet environment with a working microphone
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">
              <div className="flex items-center gap-2">
                <User className="h-6 w-6" />
                {getCandidateName()}
              </div>
            </CardTitle>
            <p className="text-blue-100 flex items-center gap-2 mt-2">
              <Briefcase className="h-4 w-4" />
              {getJobTitle()}
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Status Banner */}
            {callStatus === 'idle' && !isExpired && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ready to start your interview. Click the button below when you're ready.
                  {hoursUntilExpiry < 24 && (
                    <span className="block mt-1 text-orange-600 font-medium">
                      This link expires in {Math.round(hoursUntilExpiry)} hours.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {callStatus === 'connecting' && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Connecting to AI interviewer... Please allow microphone access if prompted.
                </AlertDescription>
              </Alert>
            )}

            {callStatus === 'active' && (
              <Alert className="bg-green-50 border-green-200">
                <Video className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Interview in progress. Speak clearly and take your time.
                </AlertDescription>
              </Alert>
            )}

            {callStatus === 'ended' && (
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Interview completed! Thank you for your time. You may now close this page.
                </AlertDescription>
              </Alert>
            )}

            {/* Interview Controls */}
            {callStatus === 'idle' && !isExpired && (
              <div className="text-center py-8">
                <Button
                  size="lg"
                  onClick={startInterview}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg"
                >
                  <Phone className="mr-2 h-6 w-6" />
                  Start Interview
                </Button>
              </div>
            )}

            {callStatus === 'active' && (
              <div className="space-y-6">
                {/* Duration Display */}
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-mono font-bold">
                      {formatDuration(callDuration)}
                    </span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={toggleMute}
                    className={isMuted ? 'border-red-500 text-red-500' : ''}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="mr-2 h-5 w-5" />
                        Unmute
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-5 w-5" />
                        Mute
                      </>
                    )}
                  </Button>

                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={endInterview}
                  >
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End Interview
                  </Button>
                </div>

                {/* Tips */}
                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Tips:</strong> Speak clearly, pause between answers, and feel free to ask the AI to repeat questions.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Interview Info */}
            <div className="border-t pt-6 mt-6">
              <div className="grid gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={callStatus === 'active' ? 'default' : 'secondary'}>
                    {callStatus === 'idle' ? 'Not Started' : callStatus === 'active' ? 'In Progress' : 'Completed'}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Link Expires:</span>
                  <span className="font-medium">
                    {format(new Date(interview.linkExpiresAt), 'PPp')}
                  </span>
                </div>

                {callStatus === 'ended' && interview.duration && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Duration:</span>
                    <span className="font-medium">
                      {Math.round(interview.duration / 60)} minutes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This interview is powered by AI. Your responses will be analyzed to match your qualifications with the role.</p>
        </div>
      </div>
    </div>
  );
}
