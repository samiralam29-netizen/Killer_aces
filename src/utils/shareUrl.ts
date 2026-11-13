/**
 * Generates the shareable URL for inviting players to the active game server.
 * Always preserves the current origin so host and players connect to the same live backend instance.
 */
export function getPublicShareUrl(roomCode: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const cleanCode = encodeURIComponent((roomCode || 'DIWALI').toUpperCase());
  return `${origin}/?room=${cleanCode}`;
}

export function isDevPreviewOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.origin.includes('ais-dev-');
}

const IGNORED_PATH_SEGMENTS = new Set([
  '',
  'index.html',
  'ws',
  'api',
  'assets',
  'public',
  'room',
  'join',
]);

/**
 * Extracts a room code from the current browser URL.
 * Supports:
 *  - ?room=CODE, ?code=CODE, ?r=CODE
 *  - /CODE, /room/CODE, /join/CODE
 *  - #CODE, #room=CODE
 */
export function extractRoomCodeFromLocation(): string {
  if (typeof window === 'undefined') return '';

  // 1. Check query string (?room=ABCD, ?code=ABCD, ?r=ABCD)
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('room') || params.get('code') || params.get('r');
  if (fromQuery && /^[A-Za-z0-9_-]{2,16}$/.test(fromQuery.trim())) {
    return fromQuery.trim().toUpperCase();
  }

  // 2. Check hash (#room=ABCD or #ABCD)
  if (window.location.hash) {
    const rawHash = window.location.hash.replace(/^#/, '').trim();
    if (rawHash.toLowerCase().startsWith('room=')) {
      const val = rawHash.slice(5).trim();
      if (/^[A-Za-z0-9_-]{2,16}$/.test(val)) return val.toUpperCase();
    } else if (/^[A-Za-z0-9_-]{2,16}$/.test(rawHash)) {
      return rawHash.toUpperCase();
    }
  }

  // 3. Check pathname (/ABCD, /room/ABCD, /join/ABCD)
  const segments = window.location.pathname
    .split('/')
    .map((s) => decodeURIComponent(s).trim())
    .filter(Boolean);

  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    if (
      !IGNORED_PATH_SEGMENTS.has(last.toLowerCase()) &&
      !last.includes('.') &&
      /^[A-Za-z0-9_-]{2,16}$/.test(last)
    ) {
      return last.toUpperCase();
    }
  }

  return '';
}

/**
 * Extracts a room code if a user pastes a full invite URL or types a raw code.
 */
export function extractRoomCodeFromInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  if (trimmed.includes('://') || trimmed.includes('?') || trimmed.includes('/')) {
    try {
      const normalized = trimmed.startsWith('http') ? trimmed : `https://dummy.local/${trimmed.replace(/^\/+/, '')}`;
      const parsed = new URL(normalized);
      const qCode =
        parsed.searchParams.get('room') ||
        parsed.searchParams.get('code') ||
        parsed.searchParams.get('r');
      if (qCode) return qCode.trim().toUpperCase().slice(0, 16);

      if (parsed.hash) {
        const h = parsed.hash.replace(/^#/, '').replace(/^room=/i, '').trim();
        if (/^[A-Za-z0-9_-]{2,16}$/.test(h)) return h.toUpperCase();
      }

      const segs = parsed.pathname.split('/').filter(Boolean);
      if (segs.length > 0) {
        const last = segs[segs.length - 1];
        if (!IGNORED_PATH_SEGMENTS.has(last.toLowerCase()) && /^[A-Za-z0-9_-]{2,16}$/.test(last)) {
          return last.toUpperCase();
        }
      }
    } catch {
      // Fall through to raw cleanup
    }
  }

  return trimmed.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16);
}
