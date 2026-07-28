'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Download, Loader, Eye, EyeOff, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { SessionTermPicker } from '@/components/academic/session-term-picker';
import type { AcademicSessionOption } from '@/lib/academic-calendar-types';
import { ReportCardView, type ReportCardViewData } from '@/components/results/report-card-view';
import { SCHOOL_BRAND, schoolPhoneLine } from '@/lib/school-brand';
import { SchoolLogo } from '@/components/brand/school-logo';

function openReportCardHtml(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    URL.revokeObjectURL(url);
    throw new Error('Pop-up blocked. Allow pop-ups to download/print the report card.');
  }
  // Revoke after the new tab has a chance to load.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function AdvancedResultChecker() {
  const [step, setStep] = useState<'input' | 'results'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  const [formData, setFormData] = useState({
    pin: '',
    admissionNumber: '',
  });

  const [results, setResults] = useState<ReportCardViewData | null>(null);
  const [sessionTermOptions, setSessionTermOptions] = useState<AcademicSessionOption[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/results/check');
        const data = await response.json();
        if (!response.ok) return;
        const rows = Array.isArray(data.sessions) ? data.sessions : [];
        setSessionTermOptions(rows);
        if (data.current?.sessionId) setSelectedSessionId(data.current.sessionId);
        if (data.current?.termId) setSelectedTermId(data.current.termId);
        else if (rows[0]) {
          setSelectedSessionId(rows[0].id);
          setSelectedTermId(rows[0].terms[0]?.id ?? '');
        }
      } catch {
        // no-op: user can still attempt with current session/term fallback server-side
      }
    })();
  }, []);

  async function handleCheckResults(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.pin.trim()) throw new Error('PIN is required');
      if (!formData.admissionNumber.trim()) throw new Error('Admission number is required');

      const response = await fetch('/api/results/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: formData.pin,
          admissionNumber: formData.admissionNumber,
          sessionId: selectedSessionId || undefined,
          termId: selectedTermId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const base = data.error || 'Failed to retrieve results';
        const extra =
          typeof data.pinShopUrl === 'string' && data.pinShopUrl
            ? ` You can get a PIN at ${data.pinShopUrl}.`
            : '';
        throw new Error(`${base}${extra}`);
      }

      setResults(data.results);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/results/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: formData.pin,
          admissionNumber: formData.admissionNumber,
          sessionId: selectedSessionId || undefined,
          termId: selectedTermId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report card');
      }

      if (typeof data.html === 'string' && data.html.length > 0) {
        openReportCardHtml(data.html);
      } else {
        throw new Error('Report card HTML was empty');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {step === 'input' && (
        <Card className="overflow-hidden border-emerald-900/15 shadow-md">
          <div className="border-b border-emerald-900/10 bg-[radial-gradient(circle_at_top_left,rgba(20,83,45,0.12),transparent_45%),linear-gradient(180deg,#f7faf5,#fff)] px-6 py-6">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <SchoolLogo size={72} priority />
              <div className="sm:flex-1">
                <p className="font-serif text-lg font-bold uppercase tracking-wide text-emerald-950 sm:text-xl">
                  {SCHOOL_BRAND.shortName}
                </p>
                <p className="text-xs text-slate-600 sm:text-sm">{SCHOOL_BRAND.address}</p>
                <p className="text-xs italic text-emerald-800">Motto: {SCHOOL_BRAND.motto}</p>
              </div>
            </div>
          </div>
          <CardHeader>
            <CardTitle>Check Your Results</CardTitle>
            <CardDescription>
              Enter your admission number and result checking PIN to view and download your end-of-term
              result.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-emerald-200 bg-emerald-50">
              <Info className="h-4 w-4 text-emerald-700" />
              <AlertDescription className="text-emerald-950">
                Result Checking PIN is required. Contact the school office ({schoolPhoneLine()}) or visit
                the PIN shop if you do not have one.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCheckResults} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admission">Admission Number *</Label>
                <p className="text-xs text-muted-foreground">Format: HAA/YYYY/### (e.g., HAA/2024/001)</p>
                <Input
                  id="admission"
                  value={formData.admissionNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, admissionNumber: e.target.value.toUpperCase() })
                  }
                  placeholder="HAA/2024/001"
                  disabled={loading}
                  className="font-mono"
                />
              </div>

              <SessionTermPicker
                sessions={sessionTermOptions}
                sessionId={selectedSessionId}
                termId={selectedTermId}
                onSessionChange={setSelectedSessionId}
                onTermChange={setSelectedTermId}
                disabled={loading}
              />

              <div className="space-y-2">
                <Label htmlFor="pin">Result Checking PIN *</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.toUpperCase() })}
                    placeholder="RES1-2345-6789"
                    disabled={loading}
                    className="font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Format: XXXX-XXXX-XXXX</p>
              </div>

              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold">Don&apos;t have a PIN?</p>
                <Link href="/pin-shop">
                  <Button type="button" variant="outline" className="w-full">
                    Where to get Result PIN
                  </Button>
                </Link>
              </div>

              <Button
                type="submit"
                disabled={
                  loading ||
                  !formData.admissionNumber ||
                  !formData.pin ||
                  !selectedSessionId ||
                  !selectedTermId
                }
                className="w-full bg-emerald-900 hover:bg-emerald-800"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Results'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'results' && results && (
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ReportCardView data={results} />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setStep('input');
                setResults(null);
                setError(null);
              }}
              className="flex-1"
            >
              Check Another Result
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex-1 bg-emerald-900 hover:bg-emerald-800"
            >
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Preparing PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download / Print Report Card
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
