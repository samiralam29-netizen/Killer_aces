import React from 'react';
import { PlayingCard, Suit } from '../types/game';
import { SUIT_COLORS, VALUE_LABELS } from '../game/constants';

interface CardViewProps {
  card?: PlayingCard;
  isFaceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  revealedInRound?: number;
  highlight?: boolean;
}

/**
 * Exact Suit Pip Icons matching the "Table Cards" reference design.
 * Features plump modern hearts, bold pointed spades, solid geometric diamonds, and 3-leaf clover clubs.
 */
export const SuitPip: React.FC<{
  suit: Suit;
  className?: string;
  isRed?: boolean;
}> = ({ suit, className = 'w-3.5 h-3.5', isRed }) => {
  const red = isRed ?? SUIT_COLORS[suit] === 'red';
  const fill = red ? '#C8102E' : '#111827';

  switch (suit) {
    case 'Hearts':
      return (
        <svg viewBox="0 0 100 100" className={className} fill={fill} xmlns="http://www.w3.org/2000/svg">
          <path d="M 50 88 C 50 88 12 58 12 34 C 12 18 25 10 37 10 C 44 10 48 14 50 18 C 52 14 56 10 63 10 C 75 10 88 18 88 34 C 88 58 50 88 50 88 Z" />
        </svg>
      );
    case 'Diamonds':
      return (
        <svg viewBox="0 0 100 100" className={className} fill={fill} xmlns="http://www.w3.org/2000/svg">
          <path d="M 50 8 L 88 50 L 50 92 L 12 50 Z" />
        </svg>
      );
    case 'Clubs':
      return (
        <svg viewBox="0 0 100 100" className={className} fill={fill} xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="30" r="20" />
          <circle cx="31" cy="58" r="19" />
          <circle cx="69" cy="58" r="19" />
          <circle cx="50" cy="52" r="16" />
          <path d="M 50 52 C 49 68 47 84 42 92 L 58 92 C 53 84 51 68 50 52 Z" />
        </svg>
      );
    case 'Spades':
      return (
        <svg viewBox="0 0 100 100" className={className} fill={fill} xmlns="http://www.w3.org/2000/svg">
          <path d="M 50 10 C 50 10 12 44 12 66 C 12 80 23 88 36 88 C 43 88 47 84 50 80 C 49 84 48 90 44 94 L 56 94 C 52 90 51 84 50 80 C 53 84 57 88 64 88 C 77 88 88 80 88 66 C 88 44 50 10 50 10 Z" />
        </svg>
      );
    default:
      return null;
  }
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  isFaceDown,
  size = 'md',
  label,
  className = '',
  revealedInRound,
  highlight = false,
}) => {
  // Proportional standard card dimensions matching reference (aspect ratio ~1:1.4)
  const sizeClasses = {
    sm: 'w-12 h-17 text-xs rounded-lg',
    md: 'w-20 h-28 sm:w-24 sm:h-[136px] text-sm rounded-xl',
    lg: 'w-28 h-40 sm:w-35 sm:h-[196px] text-base rounded-2xl',
  }[size];

  // A card is treated as face down if explicitly requested, or if card is unrevealed
  const isCardFaceDown = isFaceDown !== undefined ? isFaceDown : !card?.isRevealed;

  // -----------------------------------------------------------------
  // Facedown Cardback (Coordinated with the modern Table Cards design)
  // Deep obsidian #111827 with solid #C8102E crimson outline and geometric pattern
  // -----------------------------------------------------------------
  if (isCardFaceDown || !card) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center select-none overflow-hidden border-[2px] border-[#C8102E] bg-[#111827] ${sizeClasses} ${className}`}
        style={{
          boxShadow: highlight
            ? '0 0 0 2px #f43f5e, 0 8px 20px rgba(0,0,0,0.7)'
            : '0 4px 14px rgba(0,0,0,0.5)',
        }}
      >
        {/* Inner geometric framing */}
        <div className="absolute inset-1 border border-slate-700/60 rounded-[inherit] pointer-events-none" />
        <div className="absolute inset-2 border border-[#C8102E]/30 rounded-[inherit] pointer-events-none" />

        {/* Subtle modern diamond lattice watermark */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage: `radial-gradient(#C8102E 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
          }}
        />

        {/* Center Ace / Diamond Mark */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div
            className={`rounded-full border border-[#C8102E]/60 bg-[#182133] flex items-center justify-center text-[#C8102E] shadow-inner ${
              size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'
            }`}
          >
            <SuitPip suit="Spades" className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'} isRed={true} />
          </div>

          {label && (
            <div className="mt-1 px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-slate-200 text-[8px] font-mono font-bold tracking-wider uppercase">
              {label}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Faceup Card (Table Cards Design from Reference Image)
  // - White card base (#FFFFFF)
  // - Red cards: Solid red border (#C8102E), red text/pips (#C8102E)
  // - Black cards: Clean dark border (#111827 / slate-300), black text/pips (#111827)
  // - Top-left: Bold Value + small Suit
  // - Center: Single large solid center mark!
  // - Bottom-right: Inverted small Suit + Bold Value
  // -----------------------------------------------------------------
  const isRed = SUIT_COLORS[card.suit] === 'red';
  const valueDisplay = VALUE_LABELS[card.value];

  // Colors from reference image:
  const primaryColor = isRed ? '#C8102E' : '#111827';
  const textColorClass = isRed ? 'text-[#C8102E]' : 'text-[#111827]';

  // Distinctive card border from reference:
  // Red suits have a solid red border; black suits have a crisp dark/slate border
  const borderClass = isRed
    ? 'border-[2px] sm:border-[2.5px] border-[#C8102E]'
    : 'border border-slate-300 shadow-sm';

  // Corner indices sizing and positioning
  const topLeftClass = size === 'sm' ? 'top-1 left-1.5' : size === 'md' ? 'top-1.5 left-2' : 'top-2.5 left-3';
  const bottomRightClass = size === 'sm' ? 'bottom-1 right-1.5' : size === 'md' ? 'bottom-1.5 right-2' : 'bottom-2.5 right-3';

  const valueFontClass =
    size === 'lg'
      ? 'text-2xl sm:text-3xl'
      : size === 'md'
      ? 'text-lg sm:text-xl'
      : 'text-[12px] sm:text-[13px]';

  const cornerPipClass =
    size === 'lg'
      ? 'w-4 h-4 sm:w-5 sm:h-5'
      : size === 'md'
      ? 'w-3 h-3 sm:w-3.5 sm:h-3.5'
      : 'w-2 h-2 sm:w-2.5 sm:h-2.5';

  // Center mark sizing: Single solid centre mark
  const centerMarkClass =
    size === 'lg'
      ? 'w-16 h-16 sm:w-20 sm:h-20'
      : size === 'md'
      ? 'w-10 h-10 sm:w-12 sm:h-12'
      : 'w-6 h-6 sm:w-7 sm:h-7';

  return (
    <div
      className={`relative select-none overflow-hidden transition-all bg-white ${borderClass} ${sizeClasses} ${className}`}
      style={{
        boxShadow: highlight
          ? '0 0 0 2px #f43f5e, 0 10px 25px rgba(0,0,0,0.5)'
          : isRed
          ? '0 3px 12px rgba(200, 16, 46, 0.15)'
          : '0 3px 12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* 1. Top-Left Index (Bold Value + Small Suit Pip underneath) */}
      <div className={`absolute ${topLeftClass} flex flex-col items-center leading-none pointer-events-none z-20 ${textColorClass}`}>
        <span className={`font-black font-sans tracking-tight ${valueFontClass}`}>
          {valueDisplay}
        </span>
        <div className="mt-0.5">
          <SuitPip suit={card.suit} isRed={isRed} className={cornerPipClass} />
        </div>
      </div>

      {/* 2. Solid Centre Mark (Signature feature: Single large solid suit mark in the middle) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <SuitPip suit={card.suit} isRed={isRed} className={centerMarkClass} />
      </div>

      {/* 3. Bottom-Right Index (Value + Suit, Inverted 180°) */}
      <div className={`absolute ${bottomRightClass} flex flex-col items-center leading-none pointer-events-none z-20 rotate-180 ${textColorClass}`}>
        <span className={`font-black font-sans tracking-tight ${valueFontClass}`}>
          {valueDisplay}
        </span>
        <div className="mt-0.5">
          <SuitPip suit={card.suit} isRed={isRed} className={cornerPipClass} />
        </div>
      </div>

      {/* 4. Round Reveal Badge if applicable */}
      {revealedInRound && (
        <div className="absolute top-1 right-1 z-30 bg-slate-900/90 border border-slate-700 text-white text-[8px] font-bold px-1 rounded-sm shadow-xs">
          R{revealedInRound}
        </div>
      )}
    </div>
  );
};
