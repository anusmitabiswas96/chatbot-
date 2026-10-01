import React, { useState, useEffect } from 'react';
import { Header, NavigationTab } from './components/Header';
import { ChatSentinel } from './components/ChatSentinel';
import { UrlScanner } from './components/UrlScanner';
import { MessageAnalyzer } from './components/MessageAnalyzer';
import { InteractionInvestigator } from './components/InteractionInvestigator';
import { EmergencyProtocol } from './components/EmergencyProtocol';
import { ScamLibrary } from './components/ScamLibrary';
import { ThreatSamplesData } from './types/security';
import { Shield, Lock, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('chat');
  const [samples, setSamples] = useState<ThreatSamplesData>({
    urls: [],
    messages: [],
    interactions: [],
  });

  // State passed to child components when navigated from another tab
  const [passedUrl, setPassedUrl] = useState('');
  const [passedMessage, setPassedMessage] = useState('');
  const [passedStory, setPassedStory] = useState('');

  // Fetch threat samples from backend on mount
  useEffect(() => {
    fetch('/api/threat-samples')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.urls) {
          setSamples(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load threat sample data:', err);
      });
  }, []);

  const handleNavigateToUrlScan = (url: string) => {
    setPassedUrl(url);
    setActiveTab('url-scanner');
  };

  const handleNavigateToMessageScan = (text: string) => {
    setPassedMessage(text);
    setActiveTab('message-analyzer');
  };

  const handleNavigateToInvestigate = (story: string) => {
    setPassedStory(story);
    setActiveTab('investigator');
  };

  const handleAnalyzeScamInChat = (prompt: string) => {
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {activeTab === 'chat' && (
          <ChatSentinel
            onNavigateToUrlScan={handleNavigateToUrlScan}
            onNavigateToMessageScan={handleNavigateToMessageScan}
            onNavigateToInvestigate={handleNavigateToInvestigate}
          />
        )}

        {activeTab === 'url-scanner' && (
          <UrlScanner initialUrl={passedUrl} sampleUrls={samples.urls} />
        )}

        {activeTab === 'message-analyzer' && (
          <MessageAnalyzer initialText={passedMessage} sampleMessages={samples.messages} />
        )}

        {activeTab === 'investigator' && (
          <InteractionInvestigator initialStory={passedStory} sampleInteractions={samples.interactions} />
        )}

        {activeTab === 'library' && (
          <ScamLibrary onAnalyzeScamInChat={handleAnalyzeScamInChat} />
        )}

        {activeTab === 'emergency' && <EmergencyProtocol />}
      </main>

      {/* Security & Privacy Reminder Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>PhishGuard AI Sentinel</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Knowledge Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Do not share live passwords or 2FA codes</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('emergency')}
              className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Emergency Help
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('library')}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Scam Directory
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
