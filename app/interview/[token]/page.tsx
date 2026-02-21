'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mic,
  MicOff,
  PhoneOff,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Briefcase,
  User,
  Volume2
} from 'lucide-react';
import { format } from 'date-fns';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Mic test state
  const [micTested, setMicTested] = useState(false);
  const [micTestLevel, setMicTestLevel] = useState(0);
  const [isTesting, setIsTesting] = useState(false);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(0);
  const micTestRef = useRef<{ stream: MediaStream | null; audioContext: AudioContext | null }>({
    stream: null,
    audioContext: null
  });

  useEffect(() => {
    validateToken();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopMicTest();
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
      vapiRef.current.on('speech-start', () => setIsSpeaking(true));
      vapiRef.current.on('speech-end', () => setIsSpeaking(false));
      vapiRef.current.on('volume-level', (level: number) => setAudioLevel(level));
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

  // Microphone test functions
  async function startMicTest() {
    setIsTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micTestRef.current.stream = stream;

      const audioContext = new AudioContext();
      micTestRef.current.audioContext = audioContext;

      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const detectSound = () => {
        if (!micTestRef.current.audioContext) return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicTestLevel(average);
        requestAnimationFrame(detectSound);
      };
      detectSound();

      // Auto-confirm after 3 seconds of good audio
      setTimeout(() => {
        setMicTested(true);
        stopMicTest();
      }, 3000);

    } catch (err) {
      console.error('Mic test error:', err);
      setError('Unable to access microphone. Please check permissions.');
      setIsTesting(false);
    }
  }

  function stopMicTest() {
    if (micTestRef.current.stream) {
      micTestRef.current.stream.getTracks().forEach(track => track.stop());
      micTestRef.current.stream = null;
    }
    if (micTestRef.current.audioContext) {
      micTestRef.current.audioContext.close();
      micTestRef.current.audioContext = null;
    }
    setIsTesting(false);
  }

  async function handleCallStart() {
    setCallStatus('active');
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setCallDuration(durationRef.current);
    }, 1000);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/api/interview-link/${token}/start`, { method: 'POST' });
    } catch (error) {
      console.error('Error notifying backend of call start:', error);
    }
  }

  async function handleCallEnd() {
    setCallStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/api/interview-link/${token}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: durationRef.current }),
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
    if (timerRef.current) clearInterval(timerRef.current);
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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getCandidateName(): string {
    if (!interview) return '';
    return interview.candidate?.name || interview.linkedInCandidate?.fullName || 'Candidate';
  }

  function getJobTitle(): string {
    if (!interview) return '';
    return interview.job?.title || interview.sourcingJob?.jobTitle || 'Position';
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background to-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Unable to Load Interview</h2>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!interview) return null;

  const isExpired = new Date(interview.linkExpiresAt) < new Date();
  const hoursUntilExpiry = Math.max(0, (new Date(interview.linkExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60));

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            AI Interview
          </Badge>
          <h1 className="text-2xl font-semibold text-foreground">
            {getJobTitle()}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center justify-center gap-2">
            <User className="h-4 w-4" />
            {getCandidateName()}
          </p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">

            {/* Status Bar */}
            <div className="px-6 py-4 bg-muted/50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-medium">{formatDuration(callDuration)}</span>
              </div>
              <Badge variant={
                callStatus === 'active' ? 'default' :
                callStatus === 'ended' ? 'secondary' : 'outline'
              }>
                {callStatus === 'idle' && 'Ready'}
                {callStatus === 'connecting' && 'Connecting...'}
                {callStatus === 'active' && 'Live'}
                {callStatus === 'ended' && 'Completed'}
              </Badge>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-6">

              {/* IDLE STATE */}
              {callStatus === 'idle' && !isExpired && (
                <>
                  {/* Mic Test Section */}
                  {!micTested ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Mic className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-medium">Test Your Microphone</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Let&apos;s make sure your audio is working properly
                        </p>
                      </div>

                      {isTesting ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-100 rounded-full"
                                style={{ width: `${Math.min(micTestLevel * 2, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {micTestLevel > 15 ? 'Good!' : 'Speak...'}
                            </span>
                          </div>
                          <p className="text-xs text-center text-muted-foreground">
                            Speak a few words to test your microphone
                          </p>
                        </div>
                      ) : (
                        <Button onClick={startMicTest} className="w-full">
                          <Mic className="h-4 w-4 mr-2" />
                          Start Microphone Test
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-medium">Ready to Begin</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your microphone is working. Start when you&apos;re ready.
                        </p>
                      </div>

                      <Button onClick={startInterview} size="lg" className="w-full">
                        Start Interview
                      </Button>

                      {hoursUntilExpiry < 24 && (
                        <p className="text-xs text-center text-orange-600">
                          This link expires in {Math.round(hoursUntilExpiry)} hours
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* CONNECTING STATE */}
              {callStatus === 'connecting' && (
                <div className="text-center py-8">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-4">Connecting to interviewer...</p>
                </div>
              )}

              {/* ACTIVE STATE */}
              {callStatus === 'active' && (
                <div className="space-y-6">
                  {/* Audio Visualization */}
                  <div className="flex items-center justify-center gap-1 h-16">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const centerDistance = Math.abs(i - 12) / 12;
                      const baseHeight = 20 + (1 - centerDistance) * 30;
                      const dynamicHeight = isSpeaking
                        ? baseHeight + Math.random() * audioLevel * 50
                        : baseHeight * 0.3;
                      return (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-75 ${
                            isSpeaking ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                          style={{ height: `${Math.min(dynamicHeight, 64)}px` }}
                        />
                      );
                    })}
                  </div>

                  {/* Status Text */}
                  <p className="text-center text-sm text-muted-foreground">
                    {isSpeaking ? 'Listening to you...' : 'AI is speaking...'}
                  </p>

                  {/* Control Buttons */}
                  <div className="flex justify-center gap-3">
                    <Button
                      variant={isMuted ? 'destructive' : 'outline'}
                      size="lg"
                      onClick={toggleMute}
                      className="w-32"
                    >
                      {isMuted ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" />
                          Unmute
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Mute
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={endInterview}
                      className="w-32 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End
                    </Button>
                  </div>
                </div>
              )}

              {/* ENDED STATE */}
              {callStatus === 'ended' && (
                <div className="text-center py-4 space-y-6">
                  <div>
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">Interview Completed</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Thank you for your time!
                    </p>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold font-mono">{formatDuration(callDuration)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Duration</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Completed</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                    <p>Your interview has been recorded and will be reviewed by the hiring team. You&apos;ll hear back within 2-3 business days.</p>
                  </div>
                </div>
              )}

              {/* EXPIRED STATE */}
              {isExpired && callStatus === 'idle' && (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">Link Expired</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This interview link has expired. Please contact the recruiter for a new link.
                  </p>
                </div>
              )}

            </div>

            {/* Footer Info */}
            {callStatus === 'idle' && !isExpired && micTested && (
              <div className="px-6 py-4 bg-muted/30 border-t">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Tips for a great interview:</p>
                    <ul className="mt-1 space-y-0.5">
                      <li>• Find a quiet place with good lighting</li>
                      <li>• Speak clearly and at a natural pace</li>
                      <li>• Take your time to think before answering</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by AI • Your responses are confidential
        </p>

      </div>
    </div>
  );
}
