import React, { useState } from 'react';
import {
  MessageSquare,
  Lock,
  Globe,
  Bell,
  Sparkles,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { GameLogEntry, QuestionLogEntry } from '../types/game';

interface LogFeedProps {
  gameLogs: GameLogEntry[];
  questionLogs: QuestionLogEntry[];
  activePlayerId: string;
}

export const LogFeed: React.FC<LogFeedProps> = ({
  gameLogs,
  questionLogs,
  activePlayerId,
}) => {
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');

  // Filter logs
  const publicLogs = gameLogs.filter((l) => !l.isPrivateTo);
  const privateLogs = gameLogs.filter((l) => l.isPrivateTo === activePlayerId);

  const displayedLogs = activeTab === 'public' ? publicLogs : privateLogs;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs flex flex-col h-[320px] shadow-lg">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-white font-serif">Table Activity & Logs</h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('public')}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
              activeTab === 'public'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Public ({publicLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('private')}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
              activeTab === 'private'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Private ({privateLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Log Feed List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {displayedLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic">
            {activeTab === 'public'
              ? 'No public activity yet.'
              : 'No private notifications or partner hits for you yet.'}
          </div>
        ) : (
          displayedLogs.map((log) => {
            const isPartner = log.type === 'partner_hit';
            const isPower = log.type === 'power';
            const isQuestion = log.type === 'question';

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition-all ${
                  isPartner
                    ? 'bg-amber-950/50 border-amber-500/60 text-amber-200'
                    : isPower
                    ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                    : isQuestion
                    ? 'bg-slate-950/60 border-slate-800/80 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                  <span className="font-mono">Round {log.round}</span>
                  {isPartner && (
                    <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Partner Alert
                    </span>
                  )}
                </div>
                <div>{log.text}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
