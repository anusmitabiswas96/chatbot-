import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Upload,
  Image as ImageIcon,
  X,
  Bot,
  User,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage } from '../types/security';

interface ChatSentinelProps {
  onNavigateToUrlScan?: (url: string) => void;
  onNavigateToMessageScan?: (text: string) => void;
  onNavigateToInvestigate?: (story: string) => void;
}

export const ChatSentinel: React.FC<ChatSentinelProps> = ({
  onNavigateToUrlScan,
  onNavigateToMessageScan,
  onNavigateToInvestigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Hello! I am **PhishGuard Sentinel**, your AI cybersecurity defense analyst.

I can protect you across three critical vectors:
1. **Malicious URL Detection**: Paste any link to detect typosquatting, credential harvesting, fake logins, and malware traps.
2. **Scam Message Analysis**: Paste SMS, WhatsApp, Telegram, or social media messages (or upload a screenshot) to detect smishing, fake job offers, impersonation, and extortion.
3. **Suspicious Interaction Investigation**: Tell me about an online conversation, romantic interest, buyer, or recruiter that feels strange, and I'll walk you through a step-by-step investigation and containment plan.

How can I safeguard you today? Paste a link, message, or describe what happened.`,
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPEG, WebP)');
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

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent && !selectedImage) return;

    const userMsgId = 'user-' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: messageContent,
      timestamp: Date.now(),
      imageBase64: selectedImage?.base64,
      mimeType: selectedImage?.mimeType,
      imagePreview: selectedImage?.preview,
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput('');
    const imagePayload = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          imageBase64: imagePayload?.base64,
          mimeType: imagePayload?.mimeType,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: 'model-' + Date.now(),
        role: 'model',
        text: data.reply || 'Analysis completed.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'model',
          text: `⚠️ **Analysis Connection Error**: ${err.message || 'Unable to communicate with the security engine.'} Please try again.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: 'Chat history cleared. What URL, message, or suspicious interaction would you like me to inspect?',
        timestamp: Date.now(),
      },
    ]);
    setSelectedImage(null);
  };

  // Quick preset queries
  const promptPresets = [
    {
      label: 'Inspect Phishing Link',
      text: 'Can you check if this URL is safe or a phishing trap: http://paypa1-security-verification.info/auth/login.php',
    },
    {
      label: 'Analyze WhatsApp "Hi Mum" Message',
      text: 'I got this WhatsApp message from an unknown number: "Hi mum, my phone broke down and this is my new number. I have an urgent bill of £680 due in an hour. Can you transfer it for me?" Is this a scam?',
    },
    {
      label: 'Telegram Crypto Job Offer',
      text: 'Someone on Telegram named Emily contacted me offering $400/day to like YouTube videos, but asks me to deposit USDT to unlock tasks. What is this scheme?',
    },
    {
      label: 'Facebook Marketplace Zelle Scam',
      text: 'A buyer on Facebook Marketplace wants to pay me via Zelle, but said I need to pay $200 first to upgrade my Zelle account to a business profile to receive their funds. Is this legitimate?',
    },
  ];

  // Helper to render markdown text neatly
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold handling
      let formatted: React.ReactNode = line;

      // Check if line is a header
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-cyan-300 mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-bold text-white mt-3.5 mb-1.5 border-b border-slate-800 pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-lg font-bold text-white mt-4 mb-2">
            {line.replace('# ', '')}
          </h2>
        );
      }

      // Check if line is a bullet item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-slate-200 pl-2">
            <span className="text-cyan-400 mt-1">▪</span>
            <span className="flex-1">{renderInlineMarkdown(itemText)}</span>
          </div>
        );
      }

      // Check if line is numbered item (e.g. 1. )
      const numberMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numberMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-slate-200 pl-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">{numberMatch[1]}.</span>
            <span className="flex-1">{renderInlineMarkdown(numberMatch[2])}</span>
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 text-slate-200 leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Process bold **text** and `code`
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matchStr = match[0];
      if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-white">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 font-mono text-xs text-cyan-300">
            {matchStr.slice(1, -1)}
          </code>
        );
      }
      lastIndex = match.index + matchStr.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto px-4 py-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">Active Sentinel AI</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">Gemini 3.8 Flash Threat Engine</span>
        </div>

        <button
          onClick={resetChat}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-900 transition-colors"
          title="Clear conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-sm ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-xl p-4 transition-all ${
                msg.role === 'user'
                  ? 'bg-cyan-600/20 text-slate-100 border border-cyan-500/30 shadow-sm'
                  : 'bg-slate-900/80 text-slate-200 border border-slate-800 shadow-sm'
              }`}
            >
              {/* Optional uploaded image */}
              {msg.imagePreview && (
                <div className="mb-3 rounded-lg overflow-hidden border border-slate-700 max-w-sm">
                  <img
                    src={msg.imagePreview}
                    alt="Uploaded screenshot"
                    className="max-h-60 w-auto object-contain bg-slate-950"
                  />
                  <div className="p-1.5 bg-slate-900/90 text-xs text-slate-400 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-cyan-400" />
                    <span>Analyzed Chat Screenshot</span>
                  </div>
                </div>
              )}

              {/* Message text content */}
              <div className="prose prose-invert prose-sm max-w-none">
                {renderFormattedText(msg.text)}
              </div>

              {/* Message Footer Actions */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <span className="font-mono text-[11px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                <button
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors p-1 rounded"
                  title="Copy message"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 text-sm justify-start">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-slate-400 max-w-md flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Running forensic heuristic & scam intelligence scan...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && (
        <div className="py-2">
          <p className="text-xs text-slate-400 mb-1.5 font-medium">Quick sample queries:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {promptPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(preset.text)}
                disabled={isLoading}
                className="text-left p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
              >
                <span className="truncate pr-2">{preset.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Image Preview before sending */}
      {selectedImage && (
        <div className="mb-2 p-2 bg-slate-900 border border-cyan-500/40 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={selectedImage.preview}
              alt="Screenshot attachment"
              className="w-12 h-12 object-cover rounded border border-slate-700"
            />
            <div>
              <p className="text-xs font-medium text-slate-200">Screenshot Attached</p>
              <p className="text-[11px] text-slate-400 font-mono">Ready to inspect text & layout</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input box */}
      <div className="mt-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Paste a suspicious link, WhatsApp/SMS message, or describe an interaction..."
          rows={2}
          disabled={isLoading}
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none px-2 py-1"
        />

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 px-1">
          <div className="flex items-center gap-1.5">
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
              disabled={isLoading}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Attach screenshot of SMS, WhatsApp, or Telegram"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Attach Screenshot</span>
            </button>
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            <span>Analyze</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
