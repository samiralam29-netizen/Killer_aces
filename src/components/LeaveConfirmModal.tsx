import React from 'react';
import { AlertTriangle, LogOut, X } from 'lucide-react';

interface LeaveConfirmModalProps {
  isOpen: boolean;
  roomCode: string;
  gameStarted: boolean;
  isHost?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LeaveConfirmModal: React.FC<LeaveConfirmModalProps> = ({
  isOpen,
  roomCode,
  gameStarted,
  isHost = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#131926] border border-amber-600/50 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 id="leave-modal-title" className="font-serif font-bold text-base text-amber-100">
                Leave Game & Create New Room?
              </h3>
              <p className="text-[11px] text-slate-400">
                Current Room: <span className="font-mono font-semibold text-amber-300">{roomCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cancel and stay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Warning */}
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-[#182133] border border-slate-800 rounded-xl p-3.5">
          {gameStarted ? (
            <p>
              An active match is currently in progress. If you leave, you will be disconnected from this game, your hand will be removed from your screen, and you will return to the creation menu to start fresh.
            </p>
          ) : (
            <p>
              Are you sure you want to leave Room <strong className="text-amber-300 font-mono">{roomCode}</strong>? You will leave your current lobby seat and return to the main screen to create or join a new room.
            </p>
          )}

          {isHost && (
            <p className="text-[11px] text-amber-400 font-medium pt-1">
              Note: You are currently the room host.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Stay in Game
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Leave & Create New Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};
