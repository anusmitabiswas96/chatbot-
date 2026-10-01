import React, { useState } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  Shield,
  WifiOff,
  Key,
  Lock,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  AlertOctagon,
} from 'lucide-react';

export const EmergencyProtocol: React.FC = () => {
  const [copiedBankScript, setCopiedBankScript] = useState(false);

  const bankScript = `Hello, this is an emergency fraud report. I have just been the victim of an active wire/payment scam. 
Please immediately freeze my online banking account, issue a recall on transaction [TRANSACTION ID] for amount [AMOUNT], and place a security freeze on all outbound ACH, Zelle, and wire transfers. 
Please provide me with a fraud case reference number and transfer me to your Senior Fraud Department.`;

  const copyBankScript = () => {
    navigator.clipboard.writeText(bankScript);
    setCopiedBankScript(true);
    setTimeout(() => setCopiedBankScript(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Emergency Header */}
      <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-800/80">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-rose-900/60 border border-rose-700 shrink-0">
            <AlertOctagon className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Emergency Panic Protocol: Immediate Crisis Containment
            </h2>
            <p className="text-xs text-rose-200 mt-1">
              If you just sent money, clicked a malicious link, or let a stranger onto your computer, follow these priority containment actions right now. Minutes matter.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario 1: Just Sent Money / Bank Transfer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
          <PhoneCall className="w-4 h-4" />
          <h3>1. If You Sent Money (Wire, Zelle, Debit, or Gift Cards)</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-200">
          <p className="leading-relaxed">
            • <strong>Bank / Wire Transfer:</strong> Call the number on the back of your debit card or your bank’s 24/7 fraud hotline. Tell them explicitly: <em>"I need to initiate an urgent wire fraud recall."</em>
          </p>
          <p className="leading-relaxed">
            • <strong>Zelle / Venmo / CashApp:</strong> Contact their fraud department immediately and file a dispute citing fraud / unauthorized inducement. Simultaneously notify your funding bank.
          </p>
          <p className="leading-relaxed">
            • <strong>Gift Cards:</strong> If you read gift card numbers (Apple, Target, Google Play) to a scammer, immediately call the retailer’s gift card fraud line. If the scammer has not redeemed the balance, the issuer can freeze the funds and reissue.
          </p>
        </div>

        {/* Pre-written bank call script */}
        <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-cyan-300">Copy Script to Read to Your Bank:</span>
            <button
              onClick={copyBankScript}
              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 transition-colors"
            >
              {copiedBankScript ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs font-mono text-slate-300 leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800 select-all">
            {bankScript}
          </p>
        </div>
      </div>

      {/* Scenario 2: Remote Desktop Access */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
          <WifiOff className="w-4 h-4" />
          <h3>2. If You Installed Remote Access (AnyDesk, TeamViewer, UltraViewer)</h3>
        </div>

        <ul className="space-y-2 text-xs text-slate-200">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">1.</span>
            <span>
              <strong>Sever the connection immediately:</strong> Turn off Wi-Fi on your device or pull out the Ethernet cable. Do not leave the computer online.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">2.</span>
            <span>
              <strong>Uninstall the software:</strong> Open Control Panel / Applications and uninstall AnyDesk, TeamViewer, LogMeIn, or Zoho Assist.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">3.</span>
            <span>
              <strong>Reset passwords from a SEPARATE device:</strong> Use your phone on cellular data to change your bank, email, and password manager logins. Do NOT change passwords from the compromised PC until a malware scan is run.
            </span>
          </li>
        </ul>
      </div>

      {/* Scenario 3: Freeze Credit & Identity */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
          <Lock className="w-4 h-4" />
          <h3>3. Freeze Your Credit Across the 3 Major Bureaus (Free by Law)</h3>
        </div>
        <p className="text-xs text-slate-300">
          Freezing your credit stops scammers from taking out loans, mortgages, or credit cards in your name. It does not affect your current credit score.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <a
            href="https://www.equifax.com/personal/credit-report-services/credit-freeze/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-xs flex items-center justify-between transition-colors group"
          >
            <div>
              <span className="font-semibold text-white block">Equifax</span>
              <span className="text-slate-400 text-[11px]">Online Freeze Portal</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
          </a>

          <a
            href="https://www.experian.com/freeze/center.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-xs flex items-center justify-between transition-colors group"
          >
            <div>
              <span className="font-semibold text-white block">Experian</span>
              <span className="text-slate-400 text-[11px]">Online Freeze Portal</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
          </a>

          <a
            href="https://www.transunion.com/credit-freeze"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-xs flex items-center justify-between transition-colors group"
          >
            <div>
              <span className="font-semibold text-white block">TransUnion</span>
              <span className="text-slate-400 text-[11px]">Online Freeze Portal</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
          </a>
        </div>
      </div>

      {/* Scenario 4: Critical Golden Rule - Recovery Scammers */}
      <div className="p-5 rounded-xl bg-purple-950/40 border border-purple-800/80 space-y-2">
        <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-purple-400" />
          <h3>4. BEWARE: The Secondary "Crypto Recovery" Scam</h3>
        </div>
        <p className="text-xs text-purple-200 leading-relaxed">
          Anyone on Telegram, WhatsApp, Reddit, X/Twitter, or Instagram who messages you claiming:
          <br />
          <em>"I know an ethical hacker who can track your stolen money"</em> or <em>"Contact @CyberRecovery on Telegram"</em>
          <br />
          <strong>IS ALWAYS A SECONDARY SCAMMER.</strong> Stolen cryptocurrency or wire transfers cannot be hacked back by private individuals. They will take an upfront "investigation fee" and vanish. Only official law enforcement and registered bank fraud departments can seize funds.
        </p>
      </div>
    </div>
  );
};
