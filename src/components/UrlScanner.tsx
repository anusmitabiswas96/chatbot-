import React, { useState } from 'react';
import {
  Globe,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  ExternalLink,
  Copy,
  Check,
  Zap,
  CornerDownRight,
  Info,
  ShieldX,
  FileWarning,
} from 'lucide-react';
import { UrlAnalysisResult, UrlHeuristic, ThreatSampleUrl } from '../types/security';

interface UrlScannerProps {
  initialUrl?: string;
  sampleUrls?: ThreatSampleUrl[];
}

export const UrlScanner: React.FC<UrlScannerProps> = ({ initialUrl = '', sampleUrls = [] }) => {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<UrlAnalysisResult | null>(null);
  const [heuristic, setHeuristic] = useState<UrlHeuristic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedDefanged, setCopiedDefanged] = useState(false);

  // Defang URL for safe sharing (e.g. hxxps://example[.]com)
  const defangUrl = (raw: string) => {
    return raw
      .replace(/^https:\/\//i, 'hxxps://')
      .replace(/^http:\/\//i, 'hxxp://')
      .replace(/\./g, '[.]');
  };

  const handleScan = async (targetUrl?: string) => {
    const rawToScan = (targetUrl || urlInput).trim();
    if (!rawToScan) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setHeuristic(null);

    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawToScan }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setHeuristic(data.heuristic);
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to scan URL. Please verify the link format.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (sample: ThreatSampleUrl) => {
    setUrlInput(sample.url);
    handleScan(sample.url);
  };

  const copyDefanged = () => {
    if (!urlInput) return;
    navigator.clipboard.writeText(defangUrl(urlInput));
    setCopiedDefanged(true);
    setTimeout(() => setCopiedDefanged(false), 2000);
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'MALICIOUS':
        return {
          bg: 'bg-rose-950/40 border-rose-800/80 text-rose-200',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
        };
      case 'SUSPICIOUS':
        return {
          bg: 'bg-amber-950/40 border-amber-800/80 text-amber-200',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        };
      case 'LIKELY_SAFE':
        return {
          bg: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-200',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <Info className="w-5 h-5 text-slate-400" />,
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title & Introduction */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Malicious URL & Phishing Inspector</h2>
        </div>
        <p className="text-sm text-slate-400">
          Deconstruct deceptive domain names, homoglyphs, brand spoofing subdomains, and credential harvester links.
        </p>
      </div>

      {/* Input & Scan Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g., https://paypa1-security-verification.info/auth/login.php or usps-redelivery.xyz"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shrink-0"
          >
            {isLoading ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                <span>Deep Scanning...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Inspect URL</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Test Samples */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick test samples:</span>
          {sampleUrls.length > 0 ? (
            sampleUrls.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(s)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-mono text-[11px] truncate max-w-xs"
                title={s.url}
              >
                {s.title}
              </button>
            ))
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  const u = 'https://usps-redelivery-fee.track-pkg-service.top/confirm-billing';
                  setUrlInput(u);
                  handleScan(u);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-mono text-[11px]"
              >
                Fake USPS .top smishing
              </button>
              <button
                type="button"
                onClick={() => {
                  const u = 'http://paypa1-security-verification.info/auth/login.php';
                  setUrlInput(u);
                  handleScan(u);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-mono text-[11px]"
              >
                Typosquatted PayPal Login
              </button>
              <button
                type="button"
                onClick={() => {
                  const u = 'https://www.paypal.com/signin';
                  setUrlInput(u);
                  handleScan(u);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-mono text-[11px]"
              >
                Legitimate Official Domain
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">URL Scan Failed</p>
            <p className="text-xs text-rose-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-4">
          {/* Top Verdict Banner */}
          {(() => {
            const style = getVerdictStyle(analysis.verdict);
            return (
              <div className={`p-5 rounded-xl border ${style.bg}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-700/60 shrink-0">
                      {style.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white tracking-wide">
                          {analysis.verdict === 'MALICIOUS'
                            ? 'CRITICAL THREAT DETECTED'
                            : analysis.verdict === 'SUSPICIOUS'
                            ? 'HIGHLY SUSPICIOUS DOMAIN'
                            : analysis.verdict === 'LIKELY_SAFE'
                            ? 'LIKELY LEGITIMATE DOMAIN'
                            : 'UNKNOWN REPUTATION'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">[{analysis.verdict}]</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 mt-0.5">
                        Category: <span className="text-white font-semibold">{analysis.threatCategory}</span>
                        {analysis.targetedEntity && analysis.targetedEntity !== 'None / Generic' && (
                          <>
                            <span className="mx-2 text-slate-500">·</span>
                            Targeting: <span className="text-amber-300 font-semibold">{analysis.targetedEntity}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Threat Meter */}
                  <div className="flex flex-col items-start md:items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Risk Index</span>
                      <span className="text-2xl font-bold font-mono text-white ml-2">
                        {analysis.riskScore}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">/100</span>
                    </div>
                    <div className="w-40 h-2 bg-slate-950 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          analysis.riskScore >= 70
                            ? 'bg-rose-500'
                            : analysis.riskScore >= 35
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, analysis.riskScore))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Safe Defanged Copy Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-300">
                    <span className="text-slate-400">Defanged for safe sharing:</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                      {defangUrl(urlInput)}
                    </span>
                  </div>
                  <button
                    onClick={copyDefanged}
                    className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    {copiedDefanged ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Defanged Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Forensic Technical Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domain Deconstruction */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Domain Forensics & Telemetry</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Root Domain:</span>
                  <span className="font-mono text-white">{analysis.domainAnalysis.rootDomain || heuristic?.host}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Brand Spoofing Flag:</span>
                  <span className={`font-semibold ${analysis.domainAnalysis.isSpoofed ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {analysis.domainAnalysis.isSpoofed ? 'YES - Spoofed / Typosquatted' : 'NO - Registered entity matches'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">TLD Risk Profile:</span>
                  <span className="text-slate-200">{analysis.domainAnalysis.tldReputation}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Structural Complexity:</span>
                  <span className="text-slate-200">{analysis.domainAnalysis.structureFlags}</span>
                </div>
                {heuristic?.isIpHost && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-rose-300">
                    <span>Host Type:</span>
                    <span className="font-mono font-bold">Raw IP Address (High Risk)</span>
                  </div>
                )}
                {heuristic?.detectedBrands && heuristic.detectedBrands.length > 0 && (
                  <div className="flex items-center justify-between pt-1 text-amber-300">
                    <span>Targeted Brand Strings:</span>
                    <span className="font-mono">{heuristic.detectedBrands.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detected Deception Tactics */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-amber-400" />
                <span>Detected Deception Tactics</span>
              </h3>

              {analysis.detectedTactics && analysis.detectedTactics.length > 0 ? (
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysis.detectedTactics.map((tactic, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">⚠️</span>
                      <span className="leading-relaxed">{tactic}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No anomalous deceptive heuristics flagged.</p>
              )}
            </div>
          </div>

          {/* Explanation Text */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Technical Forensic Explanation</h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {analysis.technicalExplanation}
            </p>
          </div>

          {/* Immediate Actionable Advice */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Recommended Containment & Next Steps</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {analysis.immediateAdvice.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono text-[11px] mt-0.5">{idx + 1}.</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
