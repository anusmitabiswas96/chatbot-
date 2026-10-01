import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Zap,
  CheckSquare,
  Square,
  Download,
  Copy,
  Check,
  ExternalLink,
  FileText,
  AlertOctagon,
  ArrowRight,
  Info,
} from 'lucide-react';
import { InvestigationResult, ThreatSampleInteraction } from '../types/security';

interface InteractionInvestigatorProps {
  initialStory?: string;
  sampleInteractions?: ThreatSampleInteraction[];
}

export const InteractionInvestigator: React.FC<InteractionInvestigatorProps> = ({
  initialStory = '',
  sampleInteractions = [],
}) => {
  const [story, setStory] = useState(initialStory);
  const [platform, setPlatform] = useState('Dating App / WhatsApp');
  const [personaClaimed, setPersonaClaimed] = useState('');
  const [requestMade, setRequestMade] = useState('');
  const [financialExposure, setFinancialExposure] = useState('None so far');
  const [credentialsExposed, setCredentialsExposed] = useState('None');
  const [timeframe, setTimeframe] = useState('Past week');

  const [isLoading, setIsLoading] = useState(false);
  const [investigation, setInvestigation] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User-checked tasks in the containment plan
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});
  const [copiedDossier, setCopiedDossier] = useState(false);

  const toggleTask = (index: number) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleInvestigate = async (overrideStory?: string) => {
    const finalStory = (overrideStory !== undefined ? overrideStory : story).trim();
    if (!finalStory && !requestMade) {
      setError('Please describe what happened or what the person requested.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInvestigation(null);
    setCompletedTasks({});

    try {
      const res = await fetch('/api/investigate-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionStory: finalStory,
          platform,
          personaClaimed,
          requestMade,
          financialExposure,
          credentialsExposed,
          timeframe,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setInvestigation(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to complete forensic investigation.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (sample: ThreatSampleInteraction) => {
    setStory(sample.title + ': ' + sample.requestMade);
    setPlatform(sample.platform);
    setPersonaClaimed(sample.personaClaimed);
    setRequestMade(sample.requestMade);
    setFinancialExposure(sample.financialExposure);
    setCredentialsExposed(sample.credentialsExposed);
    setTimeframe(sample.timeframe);

    handleInvestigate(sample.title + ' — ' + sample.requestMade);
  };

  const exportDossier = () => {
    if (!investigation) return;

    const reportContent = `PHISHGUARD SENTINEL - CYBERCRIME INCIDENT DOSSIER
Generated: ${new Date().toISOString()}
Severity Level: ${investigation.incidentSeverity}
Classification: ${investigation.schemeClassification}
Confidence: ${investigation.confidenceLevel}

==================================================
1. EXECUTIVE SUMMARY
==================================================
${investigation.executiveSummary}

==================================================
2. THREAT ACTOR PLAYBOOK & ATTACK STAGE
==================================================
Current Phase: ${investigation.currentPhase}
Playbook Steps:
${investigation.threatActorPlaybook.map((s, i) => `${i + 1}. ${s}`).join('\n')}

==================================================
3. IMMEDIATE CONTAINMENT CHECKLIST
==================================================
${investigation.immediateContainmentPlan
  .map(
    (c, i) =>
      `[${completedTasks[i] ? 'COMPLETED' : 'PENDING'}] (${c.priority}) ${c.action}: ${c.detail}`
  )
  .join('\n')}

==================================================
4. CRITICAL WARNINGS (RECOVERY SCAM DEFENSE)
==================================================
${investigation.criticalWarnings.map((w) => `! ${w}`).join('\n')}

==================================================
5. EVIDENCE PRESERVATION CHECKLIST
==================================================
${investigation.evidencePreservationChecklist.map((e) => `- ${e}`).join('\n')}

==================================================
6. OFFICIAL REPORTING CHANNELS
==================================================
${investigation.officialReportingChannels
  .map((r) => `${r.agency} (${r.url})\nPurpose: ${r.purpose}\nWhat to report: ${r.whatToReport}\n`)
  .join('\n')}
`;

    // Download file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PhishGuard-Incident-Dossier-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyDossierText = () => {
    if (!investigation) return;
    const text = `Incident: ${investigation.schemeClassification} (${investigation.incidentSeverity})\n\nSummary: ${investigation.executiveSummary}\n\nImmediate Actions:\n${investigation.immediateContainmentPlan.map((c) => `- [${c.priority}] ${c.action}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Suspicious Online Interaction Guided Investigation
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          Describe a suspicious encounter on a dating app, social platform, marketplace, or email. The AI investigator diagnoses the scam playbook and builds your containment dossier.
        </p>
      </div>

      {/* Input Diagnostic Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Narrative Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Describe the suspicious interaction in your own words:
          </label>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Tell us the story: How did you meet? What seemed normal at first, and what made you feel uneasy? What did they ask you to do?"
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-y"
          />
        </div>

        {/* Detailed Diagnostic Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Platform / Medium:
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="Dating App / WhatsApp">Dating App (Tinder/Hinge/Bumble)</option>
              <option value="WhatsApp / Telegram">WhatsApp or Telegram direct chat</option>
              <option value="Facebook Marketplace / Craigslist">Facebook Marketplace / OfferUp</option>
              <option value="LinkedIn / Job Board">LinkedIn / Recruiter Email</option>
              <option value="Instagram / TikTok DM">Instagram / TikTok DM</option>
              <option value="Tech Support Pop-up / Phone">Tech Support Pop-up / Inbound Call</option>
              <option value="Cryptocurrency Discord / Forum">Discord / Crypto Community</option>
              <option value="Other">Other Channel</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Who do they claim to be?
            </label>
            <input
              type="text"
              value={personaClaimed}
              onChange={(e) => setPersonaClaimed(e.target.value)}
              placeholder="e.g. Romantic interest, HR recruiter, Bank agent"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Timeframe / How long:
            </label>
            <input
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="e.g. Just today, past 2 weeks, months"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Specific Request Made:
            </label>
            <input
              type="text"
              value={requestMade}
              onChange={(e) => setRequestMade(e.target.value)}
              placeholder="e.g. Download AnyDesk, send gift cards, invest in a crypto platform, upgrade Zelle"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Financial or Data Exposure so far:
            </label>
            <input
              type="text"
              value={financialExposure}
              onChange={(e) => setFinancialExposure(e.target.value)}
              placeholder="e.g. Sent $250 via crypto, provided bank login, none yet"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Action Button & Sample Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span className="font-medium">Test real scenarios:</span>
            {sampleInteractions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(s)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              >
                {s.title.split(' ')[0]} {s.title.split(' ')[1]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleInvestigate()}
            disabled={isLoading || (!story.trim() && !requestMade.trim())}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                <span>Compiling Forensic Dossier...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Launch Guided Investigation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Investigation Notice</p>
            <p className="text-xs text-rose-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Investigation Dossier Output */}
      {investigation && (
        <div className="space-y-5">
          {/* Top Severity Banner */}
          <div
            className={`p-5 rounded-xl border ${
              investigation.incidentSeverity === 'CRITICAL'
                ? 'bg-rose-950/40 border-rose-800/80'
                : investigation.incidentSeverity === 'ELEVATED'
                ? 'bg-amber-950/40 border-amber-800/80'
                : 'bg-cyan-950/40 border-cyan-800/80'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      investigation.incidentSeverity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : investigation.incidentSeverity === 'ELEVATED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    INCIDENT SEVERITY: {investigation.incidentSeverity}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-300 font-mono">
                    Confidence: {investigation.confidenceLevel}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5">
                  {investigation.schemeClassification}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Current Attack Stage: <span className="text-cyan-300 font-semibold">{investigation.currentPhase}</span>
                </p>
              </div>

              {/* Dossier Export Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={copyDossierText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  {copiedDossier ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>
                <button
                  onClick={exportDossier}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Incident Dossier (.txt)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Forensic Assessment & Case Summary</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {investigation.executiveSummary}
            </p>
          </div>

          {/* Threat Actor Playbook */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>Criminal Syndicate Playbook Deconstruction</span>
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              How the threat actors orchestrate this attack step-by-step:
            </p>
            <div className="space-y-2">
              {investigation.threatActorPlaybook.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-mono text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Immediate Containment Checklist */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Immediate Containment Checklist</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check off tasks as you perform them to secure your accounts and stop financial bleeding:
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {Object.values(completedTasks).filter(Boolean).length} of {investigation.immediateContainmentPlan.length} completed
              </span>
            </div>

            <div className="space-y-2">
              {investigation.immediateContainmentPlan.map((item, idx) => {
                const isChecked = !!completedTasks[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleTask(idx)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-100'
                    }`}
                  >
                    <button type="button" className="mt-0.5 text-cyan-400 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                            item.priority === 'URGENT'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.priority}
                        </span>
                        <span className={`font-semibold ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                          {item.action}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRITICAL WARNING: Recovery Scammers */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-xs text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>CRITICAL DEFENSE WARNING: Recovery Scammers</span>
            </div>
            {investigation.criticalWarnings.map((warn, idx) => (
              <p key={idx} className="leading-relaxed">
                • {warn}
              </p>
            ))}
          </div>

          {/* Official Reporting Agencies Grid */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Official Law Enforcement & Regulatory Reporting</span>
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Filing reports creates legal records needed for bank fraud claims and assists cybercrime taskforces:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {investigation.officialReportingChannels.map((agency, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{agency.agency}</span>
                    <a
                      href={agency.url.startsWith('http') ? agency.url : `https://${agency.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>File Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-slate-400">{agency.purpose}</p>
                  <div className="pt-1 text-[11px] text-slate-300 border-t border-slate-800/80">
                    <span className="text-slate-400 font-medium">Include: </span>
                    {agency.whatToReport}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Preservation Checklist */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Evidence Preservation (Before You Block Them)</h4>
            <p className="text-xs text-slate-400 mb-2">
              Save these digital artifacts in an offline folder for law enforcement:
            </p>
            <ul className="space-y-1 text-xs text-slate-300">
              {investigation.evidencePreservationChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono text-[11px]">▪</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
