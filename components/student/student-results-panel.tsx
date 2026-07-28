'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Eye, EyeOff, Info, Loader } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportCardView, type ReportCardViewData } from '@/components/results/report-card-view';

function openReportCardHtml(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    URL.revokeObjectURL(url);
    throw new Error('Pop-up blocked. Allow pop-ups to download/print the report card.');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function StudentResultsPanel() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [classLevel, setClassLevel] = useState('');

  const [step, setStep] = useState<'pin' | 'results'>('pin');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ReportCardViewData | null>(null);
  const [sessionTermOptions, setSessionTermOptions] = useState<
    Array<{ id: string; sessionName: string; terms: Array<{ id: string; termName: string }> }>
  >([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch('/api/student/profile', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Could not load your profile.');
        return;
      }
      setAdmissionNumber(data.admissionNumber ?? '');
      setClassLevel(data.classLevel ?? '');

      const ctxRes = await fetch('/api/student/results', { credentials: 'include' });
      const ctxData = await ctxRes.json();
      if (ctxRes.ok) {
        setSessionTermOptions(ctxData.sessions ?? []);
        if (ctxData.current?.sessionId) setSelectedSessionId(ctxData.current.sessionId);
        if (ctxData.current?.termId) setSelectedTermId(ctxData.current.termId);
      }
    } catch {
      setProfileError('Could not load your profile.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/student/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pin: pin.trim(),
          sessionId: selectedSessionId || undefined,
          termId: selectedTermId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load results');
        return;
      }
      setResults(data.results as ReportCardViewData);
      setStep('results');
    } catch {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!admissionNumber || !pin.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/results/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin.trim(),
          admissionNumber,
          sessionId: selectedSessionId || undefined,
          termId: selectedTermId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to generate report card');
        return;
      }
      if (typeof data.html === 'string' && data.html.length > 0) {
        openReportCardHtml(data.html);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (profileError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{profileError}</AlertDescription>
      </Alert>
    );
  }

  if (step === 'pin') {
    return (
      <Card className="border-emerald-900/15">
        <CardHeader>
          <CardTitle>View my results</CardTitle>
          <CardDescription>
            Enter your <strong>result checking PIN</strong> (issued by the school). Your admission
            number ({admissionNumber}) is used automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-emerald-200 bg-emerald-50">
            <Info className="h-4 w-4 text-emerald-700" />
            <AlertDescription className="text-emerald-950">
              Without a valid Result PIN you cannot view results here or on the public checker — same PIN
              works for both.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Admission:</span>{' '}
              <span className="font-mono font-medium">{admissionNumber}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Class:</span>{' '}
              <span className="font-medium">{classLevel}</span>
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Academic session</Label>
              <Select
                value={selectedSessionId}
                onValueChange={(value) => {
                  setSelectedSessionId(value);
                  const firstTerm = sessionTermOptions.find((s) => s.id === value)?.terms[0];
                  setSelectedTermId(firstTerm?.id ?? '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTermOptions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.sessionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {(sessionTermOptions.find((s) => s.id === selectedSessionId)?.terms ?? []).map(
                    (term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.termName}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="result-pin">Result PIN</Label>
              <div className="relative">
                <Input
                  id="result-pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase())}
                  placeholder="RES1-ABCD-EFGH"
                  disabled={loading}
                  className="font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !pin.trim() || !selectedSessionId || !selectedTermId}
              className="w-full bg-emerald-900 hover:bg-emerald-800"
            >
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : (
                'Show my results'
              )}
            </Button>

            <Button asChild type="button" variant="outline" className="w-full">
              <Link href="/pin-shop">Where to get Result PIN (school admin)</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (!results) return null;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ReportCardView data={results} />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setStep('pin');
            setResults(null);
            setError(null);
          }}
        >
          Use another PIN
        </Button>
        <Button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="bg-emerald-900 hover:bg-emerald-800"
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Working…' : 'Download / Print Report Card'}
        </Button>
      </div>
    </div>
  );
}
