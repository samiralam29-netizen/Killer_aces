import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  AlertCircle,
  Key,
  Users,
  SlidersHorizontal,
  Loader2,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { CustomGameSetup } from '../types/game';
import { CustomSetupModal } from './CustomSetupModal';
import { extractRoomCodeFromInput } from '../utils/shareUrl';

interface LandingScreenProps {
  initialCode?: string;
  externalError?: string;
  onClearExternalError?: () => void;
  onJoin: (
    name: string,
    code: string,
    archivesPassword?: string,
    customSetup?: CustomGameSetup,
    isHostingRoom?: boolean
  ) => void;
  onOpenRules: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  initialCode = '',
  externalError = '',
  onClearExternalError,
  onJoin,
  onOpenRules,
}) => {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>(initialCode.toUpperCase());
  // Default option is ALWAYS Join; generating a new code promotes user to Host
  const [isHosting, setIsHosting] = useState<boolean>(false);
  const [archivesPassword, setArchivesPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCheckingRoom, setIsCheckingRoom] = useState<boolean>(false);
  const [roomNotFoundCode, setRoomNotFoundCode] = useState<string>('');
  const [customSetup, setCustomSetup] = useState<CustomGameSetup>({ playerCount: 8 });
  const [isCustomSetupOpen, setIsCustomSetupOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
      setIsHosting(false);
    }
  }, [initialCode]);

  const generateNewCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let i = 0; i < 4; i++) {
      newCode += chars[Math.floor(Math.random() * chars.length)];
    }
    setCode(newCode);
    setIsHosting(true);
    setError('');
    setRoomNotFoundCode('');
    if (onClearExternalError) onClearExternalError();
  };

  const handleCodeInputChange = (rawVal: string) => {
    // Allow pasting full invite URLs like https://.../?room=7K2Q or https://.../7K2Q
    if (
      rawVal.includes('://') ||
      rawVal.includes('?room=') ||
      rawVal.includes('?code=') ||
      rawVal.includes('/')
    ) {
      const extracted = extractRoomCodeFromInput(rawVal);
      if (extracted) {
        setCode(extracted);
        setIsHosting(false);
      } else {
        setCode(rawVal.toUpperCase());
      }
    } else {
      setCode(rawVal.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16));
    }
    if (error) setError('');
    if (roomNotFoundCode) setRoomNotFoundCode('');
    if (onClearExternalError) onClearExternalError();
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    const cleanCode = extractRoomCodeFromInput(code);

    if (!cleanName) {
      setError('Please enter your name.');
      return;
    }
    if (!cleanCode) {
      setError('Please enter a game code to join, or generate a new code to host.');
      return;
    }

    setError('');
    setRoomNotFoundCode('');
    if (onClearExternalError) onClearExternalError();

    // If joining an existing game, verify that the room exists on the server first
    if (!isHosting) {
      setIsCheckingRoom(true);
      try {
        const res = await fetch(`/api/room/${encodeURIComponent(cleanCode)}`);
        if (!res.ok) {
          setError(
            `Room "${cleanCode}" was not found on this server. Make sure the host created it and shared the link from this same page.`
          );
          setRoomNotFoundCode(cleanCode);
          setIsCheckingRoom(false);
          return;
        }
      } catch {
        // Let WebSocket/HTTP join attempt handle network fallback
      } finally {
        setIsCheckingRoom(false);
      }
    }

    onJoin(
      cleanName,
      cleanCode,
      isHosting ? archivesPassword.trim() || undefined : undefined,
      isHosting ? customSetup : undefined,
      isHosting
    );
  };

  const displayError = error || externalError;

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center p-4 selection:bg-slate-800 selection:text-slate-100">
      {/* Centered Landing Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-[#182132] border border-slate-700/60 rounded-2xl p-6 sm:p-7 shadow-2xl text-slate-100 space-y-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            BLINDS — Diwali Edition
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            {isHosting
              ? `Hosting room ${code || 'new match'}. Configure your room and enter as host.`
              : "Enter a game code to join, or create a new one if you're the host."}
          </p>
        </div>

        {/* Invite Link Pre-filled Notice */}
        {!isHosting && initialCode && code === initialCode.toUpperCase() && !displayError && (
          <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Invite detected for Room <strong className="font-mono text-white">{code}</strong>. Enter your name and click Join!
            </span>
          </div>
        )}

        {/* Error notification */}
        {displayError && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
            {roomNotFoundCode && (
              <button
                type="button"
                onClick={() => {
                  setIsHosting(true);
                  setError('');
                  setRoomNotFoundCode('');
                }}
                className="text-[11px] text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer pl-6"
              >
                Host & create room "{roomNotFoundCode}" instead?
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-3.5">
          {/* Mandatory Name Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Your Name <span className="text-rose-400 font-normal">*Required</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Samir, Vikram, Pooja"
              maxLength={20}
              className="w-full bg-[#243044] border border-slate-600/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
            />
          </div>

          {/* Code Input + Join/Host Action Button */}
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeInputChange(e.target.value)}
                placeholder="E.G. 7K2Q"
                className="flex-1 min-w-0 bg-[#243044] border border-slate-600/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 font-mono tracking-widest uppercase focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={isCheckingRoom}
                className="px-5 py-2.5 rounded-xl bg-[#f5820b] hover:bg-[#d97006] disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {isCheckingRoom && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isHosting ? 'Host' : 'Join'}</span>
              </button>
            </div>

            {/* Host / Join switcher link matching clean screenshot pattern */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {!isHosting ? (
                <button
                  type="button"
                  onClick={generateNewCode}
                  className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium cursor-pointer transition-colors"
                >
                  Hosting? Generate a new code
                </button>
              ) : (
                <div className="w-full flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={generateNewCode}
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate another code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHosting(false);
                      setError('');
                      setRoomNotFoundCode('');
                    }}
                    className="text-slate-400 hover:text-slate-200 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    Joining a game instead?
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Host Setup (revealed automatically once user generates a code to host) */}
          {isHosting && (
            <div className="space-y-3 pt-1 animate-in fade-in">
              <div className="p-3 bg-[#121a28] border border-amber-500/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Match Format</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 font-semibold">
                    {customSetup.playerCount} Players · {customSetup.playerCount === 6 ? '24 Cards' : '32 Cards'}
                  </span>
                </div>

                {/* 6P vs 8P Quick Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomSetup((prev) => ({
                        playerCount: 8,
                        characterOverride:
                          prev.characterOverride && prev.characterOverride.length === 8
                            ? prev.characterOverride
                            : undefined,
                        powerOverride:
                          prev.powerOverride && prev.powerOverride.length === 8
                            ? prev.powerOverride
                            : undefined,
                      }))
                    }
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                      customSetup.playerCount === 8
                        ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-sm'
                        : 'bg-[#182132] border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold">8 Players</span>
                    <span className="text-[10px] opacity-80">32 Cards · 40m/20m/10m</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomSetup((prev) => ({
                        playerCount: 6,
                        characterOverride:
                          prev.characterOverride && prev.characterOverride.length === 6
                            ? prev.characterOverride
                            : undefined,
                        powerOverride:
                          prev.powerOverride && prev.powerOverride.length === 6
                            ? prev.powerOverride
                            : undefined,
                      }))
                    }
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                      customSetup.playerCount === 6
                        ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-sm'
                        : 'bg-[#182132] border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold">6 Players</span>
                    <span className="text-[10px] opacity-80">24 Cards · 30m/20m/10m</span>
                  </button>
                </div>

                {/* Customize Characters & Powers button */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsCustomSetupOpen(true)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {customSetup.characterOverride || customSetup.powerOverride
                        ? 'Custom Deck Configured (Edit Setup)'
                        : 'Choose Specific Characters & Powers'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Host Setup: Create Archives Password */}
              <div className="p-3 bg-[#121a28] border border-amber-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Create Archives Password</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                    Host Secret
                  </span>
                </div>
                <input
                  type="text"
                  value={archivesPassword}
                  onChange={(e) => setArchivesPassword(e.target.value)}
                  placeholder="Create a password (e.g. secret123)"
                  maxLength={30}
                  className="w-full bg-[#182132] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Only you (the host) will know this password. You can give it privately to anyone you want to access The Archives.
                </p>
              </div>
            </div>
          )}
        </form>

        <CustomSetupModal
          isOpen={isCustomSetupOpen}
          initialSetup={customSetup}
          onClose={() => setIsCustomSetupOpen(false)}
          onApply={(newSetup) => setCustomSetup(newSetup)}
        />

        {/* Rulebook Button */}
        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenRules}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-800/60 transition-all cursor-pointer font-medium"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Rulebook & How to Play</span>
          </button>
        </div>
      </div>
    </div>
  );
};
