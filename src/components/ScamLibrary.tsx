import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Shield,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface ScamLibraryProps {
  onAnalyzeScamInChat: (prompt: string) => void;
}

export const ScamLibrary: React.FC<ScamLibraryProps> = ({ onAnalyzeScamInChat }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const scamPlaybooks = [
    {
      id: 'pig-butchering',
      title: 'Sha Zhu Pan (Pig Butchering / Romance Crypto)',
      category: 'crypto',
      severity: 'CRITICAL',
      prevalence: 'Extremely High (Global Syndicates)',
      typicalHook: '"I accidentally texted the wrong number, but you seem very polite. Let\'s chat on WhatsApp."',
      modusOperandi:
        'Operated by organized crime compounds. A scammer grooms the victim over weeks or months, establishing a romantic or trusted friendship without ever meeting. They casually mention profits made on a specialized trading app. They encourage the victim to deposit small sums ($500), let them withdraw initial fake gains to build trust, and then coax life savings into a rigged platform before freezing the funds.',
      redFlags: [
        'Refuses video calls or has conveniently "broken" camera',
        'Directs you to download custom APK or third-party web trading app not on official App Store',
        'Customer support demands a 20% "tax" or "anti-money laundering fee" before you can withdraw',
      ],
      defenseRule:
        'Never invest money through any link or exchange suggested by an online acquaintance, regardless of how close you feel.',
    },
    {
      id: 'hi-mum',
      title: 'WhatsApp "Hi Mum / Dad" Impersonation',
      category: 'messaging',
      severity: 'HIGH',
      prevalence: 'Widespread in UK, Europe, Australia, US',
      typicalHook: '"Hi mum, I dropped my phone in the toilet, this is my temporary number until I get a replacement."',
      modusOperandi:
        'The scammer texts an unsuspecting parent from an unknown number posing as their son or daughter. They claim they cannot access their banking app due to 2FA on the old phone and have an urgent bill (rent, car repair, or utilities) due within the hour.',
      redFlags: [
        'Urgent request to transfer money to a third-party or unfamiliar sort code / account',
        'Excuses for why they cannot speak on a voice phone call ("microphone broken")',
        'Emotional pressure ("Mum please help I am so stressed")',
      ],
      defenseRule:
        'Always call your child on their known original number or family group chat before transferring a single penny.',
    },
    {
      id: 'smishing-tolls',
      title: 'Smishing: Toll Road & Package Delivery Fees',
      category: 'smishing',
      severity: 'HIGH',
      prevalence: 'Surging across 50 US States & Canada',
      typicalHook: '"State Toll Services: You have an overdue toll fee of $4.75. Pay now to avoid a $50 fine: https://tpass-dept.xyz"',
      modusOperandi:
        'Mass automated SMS blast claiming the recipient owes a trivial sum ($3 to $5) for an unpaid toll (EZPass, SunPass, T-Pass) or missing postal customs fee (USPS, DHL). Victims happily click because the dollar amount is small, but the site steals credit card details and CVV.',
      redFlags: [
        'Link uses suspicious TLD (.xyz, .top, .live) instead of .gov or official carrier domain',
        'Received from a random 10-digit number or international country code',
        'Threatens immediate vehicle license suspension or package destruction',
      ],
      defenseRule:
        'Government toll agencies and USPS do not send text messages with payment links for tolls. Inspect domains carefully.',
    },
    {
      id: 'task-scam',
      title: 'Telegram Daily Task / YouTube Liker Job Scam',
      category: 'jobs',
      severity: 'HIGH',
      prevalence: 'Very Common on WhatsApp & Telegram',
      typicalHook: '"Earn $300 to $800 daily by simply subscribing to YouTube channels and reviewing products from home!"',
      modusOperandi:
        'Recruiters on WhatsApp or SMS offer simple remote tasks. To prove legitimacy, they actually pay you $20 for completing the first three tasks. Then, they invite you to a VIP Telegram group where you must "recharge" or deposit your own funds to unlock high-commission "advanced tasks", ultimately stealing all deposited funds.',
      redFlags: [
        'Pay is absurdly high for trivial work (e.g. $10 per YouTube like)',
        'Requires paying or depositing cryptocurrency to unlock your own earned salary',
        'All communications occur on Telegram with anonymous managers',
      ],
      defenseRule:
        'No legitimate employer asks you to pay money or deposit crypto in order to receive your paycheck or unlock tasks.',
    },
    {
      id: 'bank-impersonator',
      title: 'Fake Bank Fraud Department Call / Vishing',
      category: 'phone',
      severity: 'CRITICAL',
      prevalence: 'Extremely Dangerous',
      typicalHook: '"This is Chase Fraud Prevention. Did you authorize a charge of $1,499.00 at Walmart in Miami?"',
      modusOperandi:
        'A scammer spoofing the bank’s official phone number calls the victim. When the victim panics and says "No, that wasn\'t me!", the scammer says: "We must transfer your funds to a secure holding account" or "Read me the one-time passcode (OTP) we just texted you to cancel the charge."',
      redFlags: [
        'Caller asks you to read back a one-time verification code or password',
        'Instructs you to move money to a "safe government account" or Zelle yourself',
        'Urges you not to tell anyone or hang up the phone',
      ],
      defenseRule:
        'Real banks never ask you for one-time passcodes or ask you to transfer money to a "safe account". Hang up and call the number on your card.',
    },
    {
      id: 'tech-support',
      title: 'Tech Support "Overpayment Refund" Scam',
      category: 'tech',
      severity: 'HIGH',
      prevalence: 'Commonly Targets Seniors & Remote Workers',
      typicalHook: '"Your annual antivirus subscription has renewed for $399. Call this number to cancel and receive a refund."',
      modusOperandi:
        'Victim calls the fake number and connects with a scammer who instructs them to install AnyDesk or TeamViewer. Once connected, they ask the victim to type their bank account. The scammer modifies the HTML on screen to make it look like they accidentally refunded $39,900 instead of $399, then cry and beg the victim to send the difference back via gift cards or Bitcoin ATM.',
      redFlags: [
        'Insists on taking remote control of your computer via AnyDesk or TeamViewer',
        'Shows you fake Command Prompt or inspect-element code to simulate bank transactions',
        'Demands repayment in physical gift cards, gold, or Bitcoin ATMs',
      ],
      defenseRule:
        'Never allow an unsolicited caller or pop-up to take remote control of your computer.',
    },
    {
      id: 'quishing',
      title: 'Quishing: Malicious QR Code Interception',
      category: 'smishing',
      severity: 'ELEVATED',
      prevalence: 'Growing in Parking Lots & EV Chargers',
      typicalHook: 'Physical stickers placed over parking meters: "Scan to pay parking fee online without waiting in line."',
      modusOperandi:
        'Scammers paste physical fake QR code stickers over legitimate parking meters, restaurant menus, or send QR codes in emails. When scanned with a smartphone, the QR code redirects to a credential harvesting site or payment gateway owned by criminals.',
      redFlags: [
        'Physical QR code sticker feels raised or pasted over the original meter sign',
        'Scanning opens an unfamiliar domain with weird query parameters',
        'Prompts to install a profile or mobile certificate on your phone',
      ],
      defenseRule:
        'Always preview the URL before clicking "Open in browser" after scanning any QR code in public places.',
    },
    {
      id: 'marketplace-overpayment',
      title: 'Facebook Marketplace Zelle "Business Upgrade" Scam',
      category: 'marketplace',
      severity: 'HIGH',
      prevalence: 'Very Common on P2P Marketplaces',
      typicalHook: '"I will buy your item today. I will pay in advance via Zelle, and my courier will pick it up."',
      modusOperandi:
        'The buyer insists on paying via Zelle or Venmo. Then, the seller receives a forged email purporting to be from Zelle stating: "The buyer sent money from a business account. To receive it, the seller must first pay $200 to upgrade to a business account." The buyer promises to reimburse the fee, but it\'s a total fabrication.',
      redFlags: [
        'Email comes from a free Gmail/Yahoo address pretending to be Zelle or Venmo',
        'Claim that you have to pay money to "expand limits" or receive an incoming payment',
        'Buyer refuses in-person cash payment upon pickup',
      ],
      defenseRule:
        'Zelle and Venmo do not require sellers to pay a fee to upgrade accounts to receive payments. Insist on cash in a public location.',
    },
  ];

  const filtered = scamPlaybooks.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.typicalHook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.modusOperandi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Threat Intelligence & Scam Playbook Library</h2>
        </div>
        <p className="text-sm text-slate-400">
          Deconstruct the anatomy of major 2025/2026 cybercrime schemes, psychological hooks, and verified defense countermeasures.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Schemes' },
            { id: 'smishing', label: 'SMS & Smishing' },
            { id: 'messaging', label: 'WhatsApp / Telegram' },
            { id: 'crypto', label: 'Pig Butchering' },
            { id: 'phone', label: 'Bank Imposter' },
            { id: 'jobs', label: 'Fake Job' },
            { id: 'marketplace', label: 'Marketplace' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scams, hooks..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Playbook Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((scam) => (
          <div
            key={scam.id}
            className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/90 rounded-xl p-5 space-y-3.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                  [{scam.severity}]
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{scam.prevalence}</span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">{scam.title}</h3>

              {/* Typical hook */}
              <div className="mt-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs italic text-slate-300">
                <span className="text-slate-500 not-italic block text-[10px] font-mono uppercase mb-0.5">
                  Typical Opening Hook:
                </span>
                {scam.typicalHook}
              </div>

              {/* Modus Operandi */}
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {scam.modusOperandi}
              </p>

              {/* Red Flags */}
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-200 block mb-1.5">
                  Key Red Flags:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {scam.redFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">✗</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Defense Rule */}
              <div className="mt-3 p-2 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-200">
                <strong className="text-cyan-400">Golden Defense Rule: </strong>
                {scam.defenseRule}
              </div>
            </div>

            {/* Prompt in chat */}
            <div className="pt-2">
              <button
                onClick={() =>
                  onAnalyzeScamInChat(
                    `Can you explain more about the "${scam.title}" scheme, how criminals target victims, and how I can protect someone from it?`
                  )
                }
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors"
              >
                <span>Discuss or ask questions about this scam in Chat</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
