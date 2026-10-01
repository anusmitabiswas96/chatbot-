import React from 'react';
import { Shield, MessageSquare, Globe, AlertTriangle, Search, BookOpen, LifeBuoy } from 'lucide-react';

export type NavigationTab = 'chat' | 'url-scanner' | 'message-analyzer' | 'investigator' | 'emergency' | 'library';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">PhishGuard AI</span>
                <span className="text-xs text-slate-400 font-mono">vibe-sentinel</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Threat Intelligence</span>
                <span aria-hidden="true">·</span>
                <span>URL Forensics</span>
                <span aria-hidden="true">·</span>
                <span>Scam Shield</span>
              </div>
            </div>
          </div>

          {/* Mobile Emergency Button */}
          <button
            onClick={() => setActiveTab('emergency')}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-lg hover:bg-rose-900/60 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Crisis Help</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Sentinel Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('url-scanner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === 'url-scanner'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>URL Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('message-analyzer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === 'message-analyzer'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Message Analyzer</span>
          </button>

          <button
            onClick={() => setActiveTab('investigator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === 'investigator'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Investigate Interaction</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === 'library'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Scam Library</span>
          </button>

          {/* Desktop Emergency Button */}
          <button
            onClick={() => setActiveTab('emergency')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ml-1.5 ${
              activeTab === 'emergency'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-700/60'
                : 'bg-rose-950/30 text-rose-400/90 border border-rose-900/40 hover:bg-rose-950/60 hover:text-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>I Got Scammed</span>
          </button>
        </div>
      </div>
    </header>
  );
};
