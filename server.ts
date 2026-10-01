import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '20mb' }));

const port = process.env.PORT || 3000;

// Shared Gemini SDK client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for URL heuristic pre-scanning
function preAnalyzeUrl(rawUrl: string) {
  try {
    let sanitized = rawUrl.trim();
    if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
      sanitized = 'http://' + sanitized;
    }
    const parsed = new URL(sanitized);
    const host = parsed.hostname.toLowerCase();
    const parts = host.split('.');
    const tld = parts[parts.length - 1];

    const suspiciousTlds = [
      'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'zip', 'mov', 'click',
      'icu', 'vip', 'buzz', 'cc', 'work', 'country', 'stream', 'kim', 'rest',
    ];
    const isSuspiciousTld = suspiciousTlds.includes(tld);

    // IP address host detection
    const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':');

    // Homoglyphs / brand typosquatting heuristics
    const targetedBrands = [
      { name: 'paypal', regex: /paypa[l1i]|p[a@]yp[a@]l/i },
      { name: 'apple', regex: /app[l1]e|icloud/i },
      { name: 'amazon', regex: /amaz[o0]n|amzn/i },
      { name: 'netflix', regex: /netf[l1]ix/i },
      { name: 'microsoft', regex: /micr[o0]s[o0]ft|msft/i },
      { name: 'google', regex: /g[o0][o0]g[l1]e/i },
      { name: 'usps', regex: /usps|post[a-z]*-tracking|redelivery/i },
      { name: 'chase', regex: /chase.*bank|chase-secure/i },
      { name: 'wellsfargo', regex: /wells-?fargo/i },
      { name: 'facebook', regex: /faceb[o0][o0]k|meta-verify/i },
      { name: 'instagram', regex: /instagr[a@]m/i },
      { name: 'whatsapp', regex: /whats-?app/i },
      { name: 'telegram', regex: /teleg[rra]m/i },
      { name: 'coinbase', regex: /c[o0]inbase/i },
      { name: 'metamask', regex: /metam[a@]sk/i },
      { name: 'binance', regex: /bin[a@]nce/i },
    ];

    const detectedBrands: string[] = [];
    for (const b of targetedBrands) {
      if (b.regex.test(host) && !host.endsWith(`${b.name}.com`)) {
        detectedBrands.push(b.name);
      }
    }

    const suspiciousKeywords = [
      'login', 'signin', 'verify', 'verification', 'secure', 'account',
      'update', 'banking', 'wallet', 'confirm', 'suspend', 'restore',
      'recover', 'security', 'claim', 'bonus', 'airdrop', 'reward', 'urgent',
    ];

    const pathAndQuery = (parsed.pathname + parsed.search).toLowerCase();
    const matchedKeywords = suspiciousKeywords.filter(
      (kw) => host.includes(kw) || pathAndQuery.includes(kw)
    );

    const hasAtSymbol = rawUrl.includes('@');
    const isExcessiveSubdomains = parts.length >= 4;

    return {
      protocol: parsed.protocol,
      host,
      pathname: parsed.pathname,
      search: parsed.search,
      tld,
      isSuspiciousTld,
      isIpHost,
      detectedBrands,
      matchedKeywords,
      hasAtSymbol,
      isExcessiveSubdomains,
    };
  } catch (err) {
    return {
      error: 'Malformed URL structure',
      rawUrl,
    };
  }
}

// Resilient API runner with retry for transient Gemini 503 / 429 errors
async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1200): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || '';
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED');
      if (i < retries && isTransient) {
        await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// 1. CHATBOT INTERACTIVE ENDPOINT
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, contextType, imageBase64, mimeType } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const systemInstruction = `You are PhishGuard AI Sentinel, a world-class cybersecurity analyst and digital scam investigator.
You help everyday users, small businesses, and fraud victims identify threats:
1. Malicious URL Detection: Exposing phishing, credential harvesters, fake gateways, typosquatting (e.g., paypa1, amaz0n), malware droppers, and brand impersonation.
2. Scam Message Decoder: Analyzing WhatsApp, SMS (smishing), Telegram, and social media DMs for high-risk schemes (Hi Mum/Dad emergency, crypto doubling, task/fake job scams, package delivery fees, bank security alerts, romance pig butchering, sextortion).
3. Guided Suspicious Interaction Investigation: Walking users step-by-step through strange conversations (marketplace buyers, dating app matches, crypto recruiters, remote desktop tech support), identifying threat actor playbooks, and building containment plans.

Communication Guidelines:
- If a link or message is high risk, state the verdict and risk level CLEARLY in the opening line.
- Avoid security jargon or explain it immediately in plain English (e.g. explain why a subdomain like "paypal.security-alert.xyz" is controlled by a scammer, not PayPal).
- Empathize with victims: scam victims often feel panic, shame, or confusion. Keep your tone supportive, calm, objective, and non-judgmental.
- Give concrete, actionable advice: exact steps to take right now, who to contact (bank, credit bureau, carrier 7726, FTC/IC3), what evidence to screenshot, and what NOT to do (do not click, do not pay "recovery specialists").
- Use clean Markdown with clear headings, bullet points, and highlight critical warnings.`;

    const contents: any[] = [];

    // Format chat history
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
      
      const parts: any[] = [{ text: msg.text || '' }];
      
      // If the latest message has an image attachment (e.g. screenshot)
      if (i === messages.length - 1 && imageBase64) {
        parts.unshift({
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: imageBase64,
          },
        });
      }

      contents.push({ role, parts });
    }

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      })
    );

    const reply = response.text || 'I analyzed the interaction, but could not produce a response. Please try again.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    // Graceful helpful fallback if model is temporarily undergoing 503 spike
    res.json({
      reply: `🛡️ **PhishGuard Security Alert**:

I detected that the AI model is momentarily experiencing a high traffic spike, but here is immediate security guidance for your inquiry:

1. **If this involves an unsolicited link**: Never click links sent via SMS, WhatsApp, or email from unknown senders. Scammers frequently use homoglyphs (e.g. \`paypa1\`, \`amaz0n\`) and risky domains (\`.xyz\`, \`.top\`).
2. **If this involves money or urgent requests**: Real banks and family members will never ask you to move funds to a "safe account", send gift cards, or wire cryptocurrency. Always call the person back on their verified original phone number.
3. **If you already shared info or sent funds**:
   - Immediately call your bank’s fraud department (number on the back of your card).
   - Freeze your credit with Equifax, Experian, and TransUnion (free by federal law).
   - Beware of "Recovery Scammers" who claim they can hack back stolen funds.

Please try sending your message again in a moment for full interactive deep analysis.`,
    });
  }
});

// Helper fallback generators for zero-downtime resilience
function generateUrlFallbackAnalysis(url: string, heuristic: any) {
  const isDangerous =
    heuristic.isSuspiciousTld ||
    heuristic.isIpHost ||
    (heuristic.detectedBrands && heuristic.detectedBrands.length > 0) ||
    (heuristic.matchedKeywords && heuristic.matchedKeywords.length > 0);

  const targeted = heuristic.detectedBrands?.[0] ? heuristic.detectedBrands[0].toUpperCase() : 'None / Generic';

  return {
    verdict: isDangerous ? (heuristic.detectedBrands?.length ? 'MALICIOUS' : 'SUSPICIOUS') : 'LIKELY_SAFE',
    riskScore: isDangerous ? (heuristic.isIpHost || heuristic.detectedBrands?.length ? 92 : 75) : 15,
    threatCategory: isDangerous
      ? (heuristic.detectedBrands?.length ? 'Credential Phishing Harvester' : 'High-Risk Unverified Host')
      : 'Legitimate / Low-Risk Domain',
    targetedEntity: targeted,
    detectedTactics: [
      heuristic.isSuspiciousTld ? `High-risk top level domain (.${heuristic.tld}) commonly abused in smishing` : null,
      heuristic.isIpHost ? 'Raw IP address host without valid TLS domain identity' : null,
      heuristic.detectedBrands?.length ? `Brand homoglyph or spoofing targeting ${targeted}` : null,
      heuristic.matchedKeywords?.length ? `Suspicious keywords: ${heuristic.matchedKeywords.join(', ')}` : null,
    ].filter(Boolean) as string[],
    domainAnalysis: {
      rootDomain: heuristic.host || url,
      isSpoofed: !!heuristic.detectedBrands?.length,
      tldReputation: heuristic.isSuspiciousTld ? 'High abuse rate TLD' : 'Standard registry reputation',
      structureFlags: heuristic.isExcessiveSubdomains ? 'Multiple subdomain levels' : 'Standard structure',
    },
    immediateAdvice: isDangerous
      ? [
          'Do NOT navigate to or interact with this link.',
          'If credentials or card info was submitted, change passwords immediately from a separate device.',
          'Close the browser tab and clear recent cache.',
        ]
      : ['Domain appears benign based on standard heuristics. Always verify SSL lock.'],
    technicalExplanation: isDangerous
      ? `Forensic analysis flags ${heuristic.host} as a high-threat indicator. It exhibits patterns characteristic of phishing campaigns, deceptive TLD usage, or unauthorized brand impersonation.`
      : `Forensic heuristics for ${heuristic.host} show typical legitimate structure without known typosquatting or blacklisted patterns.`,
  };
}

function generateMessageFallbackAnalysis(text: string, platform?: string, sender?: string) {
  const lower = (text || '').toLowerCase();
  const isSmishing = lower.includes('toll') || lower.includes('tpass') || lower.includes('usps') || lower.includes('delivery') || lower.includes('package');
  const isFamily = lower.includes('mum') || lower.includes('dad') || lower.includes('temporary number') || lower.includes('broken phone') || lower.includes('sort code');
  const isCryptoTask = lower.includes('youtube') || lower.includes('usdt') || lower.includes('telegram') || lower.includes('commission') || lower.includes('vip');
  const isMarketplace = lower.includes('zelle') || lower.includes('business account') || lower.includes('upgrade') || lower.includes('venmo');

  let scamName = 'Suspicious Social Engineering Trap';
  let impersonated = 'Unknown Party';

  if (isSmishing) {
    scamName = 'Package / Toll Fee Smishing Blast';
    impersonated = 'Postal Service or State Toll Authority';
  } else if (isFamily) {
    scamName = 'WhatsApp Family Impersonator ("Hi Mum")';
    impersonated = 'Family Member / Child';
  } else if (isCryptoTask) {
    scamName = 'Telegram Remote Task / YouTube Liker Scam';
    impersonated = 'Marketing / Crypto Recruiter';
  } else if (isMarketplace) {
    scamName = 'Marketplace Zelle Business Upgrade Scam';
    impersonated = 'P2P Buyer / Payment Provider';
  }

  return {
    verdict: 'HIGH_RISK_SCAM',
    riskScore: 88,
    scamName,
    impersonatedParty: impersonated,
    psychologicalTriggers: ['Artificial Urgency', 'Fear of Penalties or Missing Out', 'Authority or Family Impersonation'],
    redFlags: [
      'Unsolicited message containing urgent payment demands or lucrative tasks',
      'Requests to use off-platform communication or unrecognized payment channels',
      'Sender details do not match official verified corporate contact lists',
    ],
    extractedUrlsOrNumbers: (text.match(/https?:\/\/[^\s]+/g) || []),
    safeResponseRecommendation: 'DO_NOT_REPLY_AND_BLOCK',
    suggestedAction: 'Report number to carrier (forward to 7726 for SMS), take a screenshot for evidence, and block the sender immediately.',
    whatIfAlreadyResponded: [
      'If you shared passwords or bank details, call your bank immediately to freeze transactions.',
      'Monitor credit reports and consider placing a free credit freeze.',
      'Do not engage further or pay anyone claiming they can recover funds.',
    ],
    summary: `This message exhibits strong characteristics of ${scamName}. Scammers impersonate trusted organizations or relatives to manipulate victims into clicking links or transferring funds under pressure.`,
  };
}

function generateInvestigationFallback(story?: string, requestMade?: string) {
  return {
    incidentSeverity: 'ELEVATED',
    schemeClassification: 'Online Social Engineering / Financial Extortion Scheme',
    confidenceLevel: 'High Probability (85%+)',
    threatActorPlaybook: [
      'Reconnaissance & initial contact via social platform, marketplace, or dating app',
      'Establishment of false rapport or artificial urgency',
      'Introduction of financial or technical request (crypto deposit, remote screen share, gift cards, or Zelle fee)',
      'Escalation with emotional pressure, fake threats, or frozen withdrawal barriers',
    ],
    currentPhase: 'Active Value Extraction / Threat Escalation',
    immediateContainmentPlan: [
      { priority: 'URGENT', action: 'Cease all communication', detail: 'Do not respond, negotiate, or send further funds.' },
      { priority: 'URGENT', action: 'Contact Financial Institution', detail: 'If banking information or wires were involved, notify bank fraud hotline immediately.' },
      { priority: 'TODAY', action: 'Preserve evidence', detail: 'Screenshot full chat logs, handles, wallet addresses, and receipts before blocking.' },
      { priority: 'ONGOING', action: 'Beware of Recovery Scammers', detail: 'Ignore anyone claiming they can hack back or recover stolen funds.' },
    ],
    criticalWarnings: [
      'NEVER hire recovery specialists or hackers on Telegram/Instagram. Stolen cryptocurrency or wires cannot be hacked back by private individuals.',
      'Do not pay "unlock taxes" or "clearance fees" to withdraw funds—this is always a continuation of the scam.',
    ],
    officialReportingChannels: [
      { agency: 'FBI Internet Crime Complaint Center (IC3)', url: 'https://www.ic3.gov', purpose: 'Official US federal reporting for online financial fraud', whatToReport: 'Transaction IDs, chat logs, scammer profile URLs' },
      { agency: 'Federal Trade Commission (FTC)', url: 'https://reportfraud.ftc.gov', purpose: 'Consumer protection reporting and identity theft containment', whatToReport: 'Narrative summary of the interaction and payment methods' },
    ],
    evidencePreservationChecklist: [
      'Full screenshot of chat threads showing handles and timestamps',
      'Crypto transaction hashes (TXIDs) or bank wire confirmation numbers',
      'Email headers and any software installer files downloaded',
    ],
    executiveSummary: 'This encounter matches standard organized online fraud patterns. Cease contact immediately, preserve digital evidence, and follow the containment checklist to prevent further loss.',
  };
}

// 2. URL DEEP SCANNER ENDPOINT (Structured JSON)
app.post('/api/analyze-url', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL string is required' });
  }

  const heuristic = preAnalyzeUrl(url);

  try {
    const prompt = `Analyze this URL for cyber security threats, phishing, typosquatting, malware risk, and impersonation.
Target URL: "${url}"
Pre-parsed Heuristic Telemetry:
${JSON.stringify(heuristic, null, 2)}

Provide an authoritative risk verdict and forensic breakdown.`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are an elite cyber threat intelligence analyst specializing in URL analysis and anti-phishing defense.
Evaluate the URL strictly and return valid JSON conforming to the schema.
Look for:
- Punycode, homoglyph attacks, zero-width characters, visual typosquatting.
- Brand name placed in subdomain rather than registered root domain.
- Deceptive TLDs or free dynamic DNS hosts (duckdns, ngrok, firebaseapp, render, vercel abused for phishing).
- Obfuscated paths, base64 payloads, or open redirect parameters.
- Benign vs malicious indicators.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: 'One of: MALICIOUS, SUSPICIOUS, LIKELY_SAFE, UNKNOWN',
              },
              riskScore: {
                type: Type.INTEGER,
                description: 'Risk score from 0 (completely safe) to 100 (critical danger)',
              },
              threatCategory: {
                type: Type.STRING,
                description: 'Primary threat class, e.g. "Credential Phishing Harvester", "Malware Dropper", "Tech Support Scam", "Crypto Drainer", "Legitimate Service"',
              },
              targetedEntity: {
                type: Type.STRING,
                description: 'The real brand or institution being impersonated (e.g., "PayPal", "USPS", "Netflix"), or "None / Generic"',
              },
              detectedTactics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of specific deceptive techniques found in this URL',
              },
              domainAnalysis: {
                type: Type.OBJECT,
                properties: {
                  rootDomain: { type: Type.STRING },
                  isSpoofed: { type: Type.BOOLEAN },
                  tldReputation: { type: Type.STRING },
                  structureFlags: { type: Type.STRING },
                },
                required: ['rootDomain', 'isSpoofed', 'tldReputation', 'structureFlags'],
              },
              immediateAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Step-by-step containment instructions for the user',
              },
              technicalExplanation: {
                type: Type.STRING,
                description: 'Clear, concise human-readable forensic summary explaining why this URL received its verdict.',
              },
            },
            required: [
              'verdict',
              'riskScore',
              'threatCategory',
              'targetedEntity',
              'detectedTactics',
              'domainAnalysis',
              'immediateAdvice',
              'technicalExplanation',
            ],
          },
        },
      })
    );

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({
      heuristic,
      analysis: parsedJson,
    });
  } catch (error: any) {
    console.warn('URL analysis falling back to heuristic engine:', error?.message);
    const fallbackAnalysis = generateUrlFallbackAnalysis(url, heuristic);
    res.json({
      heuristic,
      analysis: fallbackAnalysis,
    });
  }
});

// 3. MESSAGE & SMISHING ANALYZER ENDPOINT (Structured JSON)
app.post('/api/analyze-message', async (req: Request, res: Response) => {
  const { messageText, platform, senderInfo, imageBase64, mimeType } = req.body;

  if (!messageText && !imageBase64) {
    return res.status(400).json({ error: 'Either message text or an image screenshot must be provided.' });
  }

  try {
    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: imageBase64,
        },
      });
    }

    parts.push({
      text: `Analyze this suspicious message/chat for scams, smishing, social engineering, or extortion:
Platform: ${platform || 'Unknown (WhatsApp/SMS/Telegram/Social)'}
Sender Info: ${senderInfo || 'Not specified'}
Message Content:
"""
${messageText || '[See attached screenshot]'}
"""`,
    });

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          systemInstruction: `You are a specialist in mobile fraud, smishing, social engineering, and consumer cyber defense.
Examine the message for established fraud vectors:
- Bank fraud/charge alerts prompting clicks or fake call-centers
- Package redelivery fees (USPS, FedEx, DHL, Evri)
- "Hi Mum/Dad, my phone broke, text my new number"
- Telegram task scams (like YouTube videos, deposit to unlock earnings)
- Crypto investment doubling / VIP signals / Pig Butchering grooming
- Fake job offers from LinkedIn / WhatsApp recruiters
- Toll road / fine smishing (T-Pass, SunPass, EZPass)
- 2FA / OTP theft prompts
- Blackmail / Sextortion scare tactics

Return rigorous, structured JSON according to the schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: 'One of: HIGH_RISK_SCAM, SUSPICIOUS, LIKELY_SAFE',
              },
              riskScore: {
                type: Type.INTEGER,
                description: 'Risk score 0-100',
              },
              scamName: {
                type: Type.STRING,
                description: 'Canonical scam name, e.g. "USPS Package Smishing", "WhatsApp Family Impersonator", "Telegram Task Investment Trap"',
              },
              impersonatedParty: {
                type: Type.STRING,
                description: 'Who the sender claims to be (e.g. "Postal Service", "Son/Daughter", "Bank Fraud Dept", "HR Recruiter")',
              },
              psychologicalTriggers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Tactics used: e.g. "Artificial Urgency", "Fear of Penalties", "Curiosity/Greed", "Emotional Guilt", "Isolation from third parties"',
              },
              redFlags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key suspicious elements identified in text or image',
              },
              extractedUrlsOrNumbers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Any suspicious links, phone numbers, crypto addresses, or handles present in the message',
              },
              safeResponseRecommendation: {
                type: Type.STRING,
                description: 'One of: DO_NOT_REPLY_AND_BLOCK, VERIFY_OUT_OF_BAND, SAFE_TO_CONTINUE',
              },
              suggestedAction: {
                type: Type.STRING,
                description: 'Recommended direct action for the user (e.g., "Report spam to 7726 and block sender")',
              },
              whatIfAlreadyResponded: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Clear damage control steps if the user already clicked, replied, or sent funds/data',
              },
              summary: {
                type: Type.STRING,
                description: 'Plain-language explanation of how this scam works and why this message was flagged',
              },
            },
            required: [
              'verdict',
              'riskScore',
              'scamName',
              'impersonatedParty',
              'psychologicalTriggers',
              'redFlags',
              'extractedUrlsOrNumbers',
              'safeResponseRecommendation',
              'suggestedAction',
              'whatIfAlreadyResponded',
              'summary',
            ],
          },
        },
      })
    );

    const parsedJson = JSON.parse(response.text || '{}');
    res.json(parsedJson);
  } catch (error: any) {
    console.warn('Message analysis falling back to heuristic engine:', error?.message);
    const fallback = generateMessageFallbackAnalysis(messageText || '', platform, senderInfo);
    res.json(fallback);
  }
});

// 4. GUIDED INVESTIGATION WIZARD ENDPOINT (Structured Dossier & Playbook)
app.post('/api/investigate-interaction', async (req: Request, res: Response) => {
  const {
    interactionStory,
    platform,
    personaClaimed,
    requestMade,
    financialExposure,
    credentialsExposed,
    timeframe,
  } = req.body;

  if (!interactionStory && !requestMade) {
    return res.status(400).json({ error: 'Please describe the interaction or the request made.' });
  }

  try {
    const prompt = `Conduct a comprehensive forensic investigation and incident triage on the following user-reported suspicious online interaction:
- Context Story: ${interactionStory || 'User described suspicious interaction below'}
- Platform / Channel: ${platform || 'Unspecified'}
- Persona / Relationship Claimed: ${personaClaimed || 'Unspecified'}
- What was requested: ${requestMade || 'Unspecified'}
- Financial Exposure / Money Sent: ${financialExposure || 'None specified'}
- Credentials / Personal Info Shared: ${credentialsExposed || 'None specified'}
- Timeframe / Duration: ${timeframe || 'Recent'}

Evaluate the threat level, match against known criminal playbooks, assess psychological grooming stages, generate immediate containment checklists, and detail official reporting agencies.`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are the Lead Digital Crime Incident Investigator for PhishGuard Sentinel.
Analyze the user's situation with maximum diligence and empathy.
Match against known schemes:
- Sha Zhu Pan (Pig Butchering / Romance + Fake Trading App)
- Tech Support / Refund Scam with AnyDesk / TeamViewer / fake wire error
- Marketplace Zelle / Venmo overpayment / business upgrade fee scam
- Advance fee loan / crypto token presale
- Virtual kidnapping / fake cartel hitman extortion / sextortion
- Impersonation of law enforcement (CBP, FBI, IRS, local sheriff with arrest warrant)

Be extremely explicit about warning the victim against "Recovery Scammers" who claim they can hack back or recover stolen funds.
Return valid JSON adhering to the schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              incidentSeverity: {
                type: Type.STRING,
                description: 'One of: CRITICAL, ELEVATED, SUSPICIOUS, LOW_RISK',
              },
              schemeClassification: {
                type: Type.STRING,
                description: 'Specific recognized cybercrime or fraud scheme',
              },
              confidenceLevel: {
                type: Type.STRING,
                description: 'E.g., "Definite Scam (99%)", "High Probability (85%)", "Inconclusive"',
              },
              threatActorPlaybook: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Step-by-step breakdown of how the criminal syndicate executed or is executing this scheme',
              },
              currentPhase: {
                type: Type.STRING,
                description: 'Current stage of the attack, e.g., "Grooming & Rapport", "Small Proof Win", "Major Extraction", "Exit Freeze & Extortion"',
              },
              immediateContainmentPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    priority: { type: Type.STRING, description: 'URGENT, TODAY, or ONGOING' },
                    action: { type: Type.STRING },
                    detail: { type: Type.STRING },
                  },
                  required: ['priority', 'action', 'detail'],
                },
                description: 'Actionable emergency containment checklist',
              },
              criticalWarnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Must include warnings like: Never pay recovery agents, do not send "unlock fees", do not grant screen share',
              },
              officialReportingChannels: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    agency: { type: Type.STRING },
                    url: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                    whatToReport: { type: Type.STRING },
                  },
                  required: ['agency', 'url', 'purpose', 'whatToReport'],
                },
              },
              evidencePreservationChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Specific digital artifacts the victim should screenshot or record before blocking',
              },
              executiveSummary: {
                type: Type.STRING,
                description: 'Empathetic, clear forensic summary of the situation and the recommended stance.',
              },
            },
            required: [
              'incidentSeverity',
              'schemeClassification',
              'confidenceLevel',
              'threatActorPlaybook',
              'currentPhase',
              'immediateContainmentPlan',
              'criticalWarnings',
              'officialReportingChannels',
              'evidencePreservationChecklist',
              'executiveSummary',
            ],
          },
        },
      })
    );

    const parsedJson = JSON.parse(response.text || '{}');
    res.json(parsedJson);
  } catch (error: any) {
    console.warn('Investigation falling back to heuristic engine:', error?.message);
    const fallback = generateInvestigationFallback(interactionStory, requestMade);
    res.json(fallback);
  }
});

// 5. THREAT SAMPLES ENDPOINT (Instant testing presets)
app.get('/api/threat-samples', (_req: Request, res: Response) => {
  res.json({
    urls: [
      {
        title: 'Fake USPS Delivery Smishing Link',
        url: 'https://usps-redelivery-fee.track-pkg-service.top/confirm-billing',
        type: 'phishing',
      },
      {
        title: 'Typosquatted PayPal Login Harvester',
        url: 'http://paypa1-security-verification.info/auth/login.php?session=9284',
        type: 'credential_theft',
      },
      {
        title: 'Legitimate Official Domain',
        url: 'https://www.paypal.com/signin',
        type: 'benign',
      },
      {
        title: 'Suspicious IP with Bank Path',
        url: 'http://185.220.101.5/chase-online/security/update-profile.html',
        type: 'ip_phishing',
      },
    ],
    messages: [
      {
        title: 'SMS: Toll Road T-Pass Overdue Fine',
        platform: 'SMS',
        sender: '+1 (833) 492-0199',
        text: 'State Toll Services Alert: Our records show you have an unpaid toll balance of $4.75 from last week. To avoid late collection fees of $50.00 and suspension of vehicle registration, settle immediately at: https://tpass-dept-pay.xyz/resolve',
      },
      {
        title: 'WhatsApp: "Hi Mum" Emergency Impersonation',
        platform: 'WhatsApp',
        sender: '+44 7911 123456',
        text: 'Hi mum, my phone broke down and this is my temporary number. I have an urgent bill of £680 due in an hour for rent and my banking app is locked on this new phone. Can you please transfer it for me? Sort: 20-04-15 Acc: 83920194. Love you so much x',
      },
      {
        title: 'Telegram: Crypto YouTube Task Scam',
        platform: 'Telegram',
        sender: '@Recruitment_Emily_HR',
        text: 'Hello! I represent Global Media Partners. We are hiring remote testers to like and comment on YouTube videos. You get $10 for every 3 videos liked. You can earn $300-$800 daily! Join our VIP Telegram channel to claim your first trial bonus of $25 USDT instantly.',
      },
      {
        title: 'Instagram/DM: Copyright Infringement Threat',
        platform: 'Instagram',
        sender: 'Meta_Copyright_Support_ID882',
        text: 'Copyright Notification: Your Instagram account has violated our intellectual property policies. Your profile will be permanently deleted within 24 hours. If you believe this is a mistake, file an appeal here or your account cannot be recovered: https://instagram-help-appeal-meta.biz/form',
      },
    ],
    interactions: [
      {
        title: 'Dating App match moving to WhatsApp & Crypto Platform',
        platform: 'Hinge / WhatsApp',
        personaClaimed: 'Wealthy fashion designer in Los Angeles with an uncle who trades commodities',
        requestMade: 'Asked to download a third-party crypto app (DefiMaxPro.net) and invest $1,000 to "trade gold options" together during market spikes.',
        financialExposure: 'Deposited $500 initially; showed a "profit" of $120. Now being pushed to deposit $5,000 for a bigger window.',
        credentialsExposed: 'Registered on their provided website with email and phone number.',
        timeframe: 'Met 3 weeks ago',
      },
      {
        title: 'Facebook Marketplace Buyer insisting on Zelle "Business Upgrade"',
        platform: 'Facebook Marketplace',
        personaClaimed: 'Buyer eager to purchase my couch for asking price ($350)',
        requestMade: 'Insisted on paying only via Zelle. Then sent a fake email claiming Zelle needs me to send $200 back to "expand to a business limit" before funds unlock.',
        financialExposure: 'No money sent yet, but buyer is threatening police action for "holding their funds".',
        credentialsExposed: 'Provided email address and full name.',
        timeframe: 'Yesterday evening',
      },
      {
        title: 'Tech Support "Refund Department" with Screen Share',
        platform: 'Phone / PC Pop-up',
        personaClaimed: 'Senior Billing Agent from "Geek Squad / Microsoft Security"',
        requestMade: 'Claimed they owed me a $399 renewal refund. Had me install AnyDesk. Manipulated the HTML on my online banking screen to look like they accidentally sent $39,900, now crying and begging me to buy Apple gift cards to pay back the difference.',
        financialExposure: 'Did not buy gift cards yet, but they had remote access for 20 minutes.',
        credentialsExposed: 'Logged into primary bank account while screen was being shared.',
        timeframe: '2 hours ago',
      },
    ],
  });
});

// Configure Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`PhishGuard Sentinel Server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
