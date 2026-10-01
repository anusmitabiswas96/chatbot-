import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  X,
  Search,
  Zap,
  Check,
  Copy,
  Info,
  HelpCircle,
  PhoneCall,
  UserX,
  ArrowRight,
} from 'lucide-react';
import { MessageAnalysisResult, ThreatSampleMessage } from '../types/security';

interface MessageAnalyzerProps {
  initialText?: string;
  sampleMessages?: ThreatSampleMessage[];
}

export const MessageAnalyzer: React.FC<MessageAnalyzerProps> = ({
  initialText = '',
  sampleMessages = [],
}) => {
  const [platform, setPlatform] = useState<'WhatsApp' | 'SMS' | 'Telegram' | 'Instagram' | 'Other'>('WhatsApp');
  const [senderInfo, setSenderInfo] = useState('');
  const [messageText, setMessageText] = useState(initialText);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MessageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setSelectedImage({
        base64,
        mimeType: file.type,
        preview: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async (customText?: string) => {
    const textToScan = (customText !== undefined ? customText : messageText).trim();
    if (!textToScan && !selectedImage) {
      setError('Please provide the message text or attach a screenshot of the chat.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/analyze-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: textToScan,
          platform,
          senderInfo,
          imageBase64: selectedImage?.base64,
          mimeType: selectedImage?.mimeType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (sample: ThreatSampleMessage) => {
    setMessageText(sample.text);
    setSenderInfo(sample.sender);
    if (sample.platform.includes('WhatsApp')) setPlatform('WhatsApp');
    else if (sample.platform.includes('SMS')) setPlatform('SMS');
    else if (sample.platform.includes('Telegram')) setPlatform('Telegram');
    else if (sample.platform.includes('Instagram')) setPlatform('Instagram');
    setSelectedImage(null);
    handleAnalyze(sample.text);
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'HIGH_RISK_SCAM':
        return {
          bg: 'bg-rose-950/40 border-rose-800/80 text-rose-200',
          title: 'CRITICAL FRAUD / SCAM DETECTED',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
        };
      case 'SUSPICIOUS':
        return {
          bg: 'bg-amber-950/40 border-amber-800/80 text-amber-200',
          title: 'SUSPICIOUS SOCIAL ENGINEERING ATTEMPT',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        };
      case 'LIKELY_SAFE':
        return {
          bg: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200',
          title: 'LOW RISK / LIKELY BENIGN MESSAGE',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-200',
          title: 'INCONCLUSIVE ANALYSIS',
          icon: <Info className="w-5 h-5 text-slate-400" />,
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            WhatsApp, SMS & Social Scam Decoder
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          Unmask smishing traps, fake family emergencies, Telegram crypto tasks, and recruiter scams with psychological trigger profiling.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        {/* Platform Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium mr-1">Platform:</span>
          {(['WhatsApp', 'SMS', 'Telegram', 'Instagram', 'Other'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                platform === p
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={senderInfo}
              onChange={(e) => setSenderInfo(e.target.value)}
              placeholder="Sender Phone Number or Handle (optional)"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Message Textarea */}
        <div>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Paste the suspicious text, SMS, or WhatsApp message here..."
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-y"
          />
        </div>

        {/* Image Attachment Preview */}
        {selectedImage && (
          <div className="p-2.5 bg-slate-950 border border-cyan-500/40 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage.preview}
                alt="Chat screenshot"
                className="w-14 h-14 object-cover rounded border border-slate-800"
              />
              <div>
                <p className="text-xs font-semibold text-white">Screenshot Attached for Forensic Inspection</p>
                <p className="text-[11px] text-slate-400">Gemini will OCR & evaluate the conversation visually</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attach Chat Screenshot</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleAnalyze()}
            disabled={isLoading || (!messageText.trim() && !selectedImage)}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" />
                <span>Decoding Scam Vectors...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Analyze Message</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Try realistic samples:</span>
          {sampleMessages.length > 0 ? (
            sampleMessages.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(s)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              >
                {s.title}
              </button>
            ))
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  loadSample({
                    title: 'WhatsApp Hi Mum',
                    platform: 'WhatsApp',
                    sender: '+44 7911 123456',
                    text: 'Hi mum, my phone broke down and this is my temporary number. I have an urgent bill of £680 due in an hour for rent. Can you please transfer it for me?',
                  })
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              >
                WhatsApp "Hi Mum"
              </button>
              <button
                type="button"
                onClick={() =>
                  loadSample({
                    title: 'USPS Smishing',
                    platform: 'SMS',
                    sender: '+1 (833) 492-0199',
                    text: 'State Toll Services Alert: Unpaid toll balance of $4.75. Avoid $50 late fee and vehicle suspension: https://tpass-dept-pay.xyz/resolve',
                  })
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              >
                Toll Road Smishing
              </button>
              <button
                type="button"
                onClick={() =>
                  loadSample({
                    title: 'Telegram Task Scam',
                    platform: 'Telegram',
                    sender: '@Recruitment_Emily_HR',
                    text: 'Earn $300-$800 daily by liking YouTube videos! Join our VIP Telegram channel to claim $25 USDT trial bonus.',
                  })
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              >
                Telegram Task Job
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Analysis Notice</p>
            <p className="text-xs text-rose-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Top Verdict Banner */}
          {(() => {
            const badge = getVerdictBadge(analysis.verdict);
            return (
              <div className={`p-5 rounded-xl border ${badge.bg}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-700/60 shrink-0">
                      {badge.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white tracking-wide">
                          {badge.title}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">[{analysis.verdict}]</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 mt-0.5">
                        Scheme Name: <span className="text-white font-semibold">{analysis.scamName}</span>
                        {analysis.impersonatedParty && (
                          <>
                            <span className="mx-2 text-slate-500">·</span>
                            Impersonating: <span className="text-amber-300 font-semibold">{analysis.impersonatedParty}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Threat meter */}
                  <div className="flex flex-col items-start md:items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Scam Confidence</span>
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

                {/* Safe Recommendation pill */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Recommended Immediate Stance:</span>
                  <span
                    className={`font-semibold px-2.5 py-0.5 rounded border ${
                      analysis.safeResponseRecommendation === 'DO_NOT_REPLY_AND_BLOCK'
                        ? 'bg-rose-950 border-rose-700 text-rose-300'
                        : analysis.safeResponseRecommendation === 'VERIFY_OUT_OF_BAND'
                        ? 'bg-amber-950 border-amber-700 text-amber-300'
                        : 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    }`}
                  >
                    {analysis.safeResponseRecommendation === 'DO_NOT_REPLY_AND_BLOCK'
                      ? '⛔ DO NOT REPLY · BLOCK IMMEDIATELY'
                      : analysis.safeResponseRecommendation === 'VERIFY_OUT_OF_BAND'
                      ? '⚠️ VERIFY OUT-OF-BAND (Call Known Number)'
                      : '✅ SAFE TO PROCEED WITH STANDARD CAUTION'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Psychological Manipulation & Red Flags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Psychological Levers */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>Psychological Manipulation Levers</span>
              </h3>
              <p className="text-xs text-slate-400 mb-2">
                Scammers manipulate emotions to bypass critical thinking:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {analysis.psychologicalTriggers.map((trigger, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-400 font-mono text-[11px] mt-0.5">◈</span>
                    <span className="leading-relaxed font-medium">{trigger}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags Identified */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Specific Red Flags Detected</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {analysis.redFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5 font-bold">✗</span>
                    <span className="leading-relaxed">{flag}</span>
                  </li>
                ))}
              </ul>

              {analysis.extractedUrlsOrNumbers && analysis.extractedUrlsOrNumbers.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Extracted Links / Contact Artifacts:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[11px]">
                    {analysis.extractedUrlsOrNumbers.map((art, idx) => (
                      <span key={idx} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                        {art}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plain Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">How This Scam Works</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* Suggested Direct Action & Damage Control */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                <span>Direct Action to Take Now</span>
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {analysis.suggestedAction}
              </p>
            </div>

            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-rose-300 mb-2 flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-400" />
                <span>What If You Already Replied or Paid?</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {analysis.whatIfAlreadyResponded.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-mono text-[11px] mt-0.5">{idx + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
