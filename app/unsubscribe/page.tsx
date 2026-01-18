'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function UnsubscribePageContent() {
  const searchParams = useSearchParams();
  const candidateSequenceId = searchParams.get('cs');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [sequenceName, setSequenceName] = useState('');

  async function handleUnsubscribe() {
    if (!candidateSequenceId) {
      setError('Invalid unsubscribe link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/resend/unsubscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateSequenceId })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setCandidateName(data.candidateName || '');
        setSequenceName(data.sequenceName || '');
      } else {
        setError(data.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Unsubscribe from Emails</CardTitle>
          <CardDescription className="text-center">
            {success
              ? 'You have been unsubscribed'
              : 'Click below to stop receiving emails from this sequence'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Successfully Unsubscribed</h3>
              {candidateName && (
                <p className="text-sm text-gray-600 mb-1">
                  Name: {candidateName}
                </p>
              )}
              {sequenceName && (
                <p className="text-sm text-gray-600">
                  Sequence: {sequenceName}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-4">
                You will no longer receive emails from this outreach campaign.
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Unsubscribe Failed</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to unsubscribe? You will no longer receive any emails
                from this recruitment campaign.
              </p>

              <Button
                onClick={handleUnsubscribe}
                disabled={loading || !candidateSequenceId}
                variant="destructive"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Unsubscribe'
                )}
              </Button>

              {!candidateSequenceId && (
                <p className="text-sm text-red-600 mt-4">
                  Invalid unsubscribe link. Please use the link from your email.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <UnsubscribePageContent />
    </Suspense>
  );
}
