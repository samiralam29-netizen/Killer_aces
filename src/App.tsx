import React, { useState, useEffect, useRef } from 'react';
import {
  createInitialGame,
  askQuestion,
  submitOrEditGuess,
  activatePower,
  buyBonusToken,
  resolveRoundGuesses,
  advanceToNextRound,
  setShabariSuit,
  cycleCardTag,
  toggleCardTagMode,
  setCardTag,
  GameState,
} from './game/engine';
import { autoPlayAllBots } from './game/botAI';
import { computeFinalScores } from './game/scoring';
import { CardValue, CharacterId, PowerId, QuestionRequest, Suit, CustomGameSetup } from './types/game';

import { Header } from './components/Header';
import { PlayerMat } from './components/PlayerMat';
import { GameBoard } from './components/GameBoard';
import { QuestionComposer } from './components/QuestionComposer';
import { GuessModal } from './components/GuessModal';
import { PowerModal } from './components/PowerModal';
import { SubmittedGuessesModal } from './components/SubmittedGuessesModal';
import { RoundResolutionModal } from './components/RoundResolutionModal';
import { FinalScoreboardModal } from './components/FinalScoreboardModal';
import { RulesReferenceModal } from './components/RulesReferenceModal';
import { AcceptanceTestsModal } from './components/AcceptanceTestsModal';
import { RoomModal } from './components/RoomModal';
import { PowerTestLabModal } from './components/PowerTestLabModal';
import { LogFeed } from './components/LogFeed';
import { User, Grid3X3, Flame, Play, Share2, Copy, Check } from 'lucide-react';
import { equipPower, equipCharacter } from './game/engine';
import { LandingScreen } from './components/LandingScreen';
import { LobbyScreen, ConnectedPlayer } from './components/LobbyScreen';
import { TheArchivesView } from './components/TheArchivesView';
import { safeStorage, safeSessionStorage } from './utils/storage';
import { extractRoomCodeFromLocation } from './utils/shareUrl';
import { LeaveConfirmModal } from './components/LeaveConfirmModal';
import { Key, Lock } from 'lucide-react';

const TAB_SESSION_KEY = 'blinds_tab_session_v2';

interface SavedTabSession {
  sessionToken: string;
  roomCode: string;
  playerName: string;
  isCreatingRoom: boolean;
  archivesPassword?: string;
  customSetup?: CustomGameSetup;
}

function loadSavedTabSession(urlRoomCode: string): SavedTabSession | null {
  const raw = safeSessionStorage.getItem(TAB_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedTabSession;
    if (!parsed?.sessionToken || !parsed?.roomCode || !parsed?.playerName) return null;
    if (urlRoomCode && urlRoomCode.toUpperCase() !== parsed.roomCode.toUpperCase()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveTabSession(session: SavedTabSession) {
  safeSessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify(session));
}

function clearTabSession() {
  safeSessionStorage.removeItem(TAB_SESSION_KEY);
}

function generateFreshSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function App() {
  const [urlRoomCode] = useState<string>(() => extractRoomCodeFromLocation());
  const [initialSavedSession] = useState<SavedTabSession | null>(() =>
    loadSavedTabSession(extractRoomCodeFromLocation())
  );

  const [activeMainTab, setActiveMainTab] = useState<'player' | 'deduction'>('player');
  const [initialRoomFromUrl, setInitialRoomFromUrl] = useState<string>(urlRoomCode);

  const [hasJoinedRoom, setHasJoinedRoom] = useState<boolean>(Boolean(initialSavedSession));
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(true);
  const [roomCode, setRoomCode] = useState<string>(
    initialSavedSession?.roomCode || urlRoomCode
  );
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(
    Boolean(initialSavedSession?.isCreatingRoom)
  );
  const [landingError, setLandingError] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>(
    initialSavedSession?.playerName || ''
  );
  const [myPlayerId, setMyPlayerId] = useState<string>('p1');
  const [isArchives, setIsArchives] = useState<boolean>(false);
  const [showArchivesView, setShowArchivesView] = useState<boolean>(false);
  const [hostArchivesPassword, setHostArchivesPassword] = useState<string>(
    initialSavedSession?.archivesPassword || ''
  );
  const [initialHostPassword, setInitialHostPassword] = useState<string>(
    initialSavedSession?.archivesPassword || ''
  );
  const [isArchivesPromptOpen, setIsArchivesPromptOpen] = useState<boolean>(false);
  const [archivesPromptPassword, setArchivesPromptPassword] = useState<string>('');
  const [archivesPromptError, setArchivesPromptError] = useState<string>('');
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState<boolean>(false);
  const [initialCustomSetup, setInitialCustomSetup] = useState<CustomGameSetup | undefined>(
    initialSavedSession?.customSetup
  );
  const [sessionToken, setSessionToken] = useState<string>(
    initialSavedSession?.sessionToken || generateFreshSessionToken()
  );
  const [isHost, setIsHost] = useState<boolean>(Boolean(initialSavedSession?.isCreatingRoom));
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [connectedPlayers, setConnectedPlayers] = useState<ConnectedPlayer[]>([]);

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGame({ roomCode: initialSavedSession?.roomCode || urlRoomCode || 'DIWALI' })
  );

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [isSubmittedGuessesModalOpen, setIsSubmittedGuessesModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isFinalScoreModalOpen, setIsFinalScoreModalOpen] = useState(false);
  const [isPowerLabOpen, setIsPowerLabOpen] = useState(false);
  const [questionWithTenHeads, setQuestionWithTenHeads] = useState(false);

  const [modalDefaultTargetId, setModalDefaultTargetId] = useState<string | undefined>();
  const [bannerAlert, setBannerAlert] = useState<{
    message: string;
    type: 'info' | 'success' | 'warn' | 'error';
  } | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnectedRef = useRef<boolean>(false);
  const gameStartedRef = useRef<boolean>(gameStarted);
  gameStartedRef.current = gameStarted;

  const applyServerMessage = (msg: any) => {
    if (!msg) return;
    if (msg.joined) applyServerMessage(msg.joined);
    if (msg.sync) applyServerMessage(msg.sync);
    if (msg.unlocked) applyServerMessage(msg.unlocked);
    if (msg.feedback) applyServerMessage(msg.feedback);

    if (msg.type === 'JOINED_SUCCESS') {
      if (msg.sessionToken) {
        setSessionToken(msg.sessionToken);
        const existing = safeSessionStorage.getItem(TAB_SESSION_KEY);
        if (existing) {
          try {
            const parsed = JSON.parse(existing);
            parsed.sessionToken = msg.sessionToken;
            if (msg.playerName) parsed.playerName = msg.playerName;
            saveTabSession(parsed);
          } catch {}
        }
      }
      if (msg.playerName) setPlayerName(msg.playerName);
      setIsHost(!!msg.isHost);
      if (msg.playerId) setMyPlayerId(msg.playerId);
      if (msg.isArchives !== undefined) setIsArchives(msg.isArchives);
    } else if (msg.type === 'ARCHIVES_UNLOCKED') {
      setIsArchives(true);
      setShowArchivesView(true);
      if (msg.playerId) setMyPlayerId(msg.playerId);
      setBannerAlert({ message: 'The Archives unlocked successfully.', type: 'success' });
    } else if (msg.type === 'SYNC_STATE') {
      setGameState(msg.state);
      setGameStarted(msg.gameStarted);
      setIsHost(msg.isHost);
      if (msg.playerId) setMyPlayerId(msg.playerId);
      if (msg.playerName) setPlayerName(msg.playerName);
      if (msg.isArchives !== undefined) setIsArchives(msg.isArchives);
      if (msg.archivesPassword !== undefined) setHostArchivesPassword(msg.archivesPassword);
      if (msg.connectedPlayers) {
        setConnectedPlayers(msg.connectedPlayers);
      }
      if (msg.state?.isGameOver) {
        setIsFinalScoreModalOpen(true);
      }
    } else if (msg.type === 'POWER_FEEDBACK') {
      setBannerAlert({ message: msg.message, type: 'info' });
    } else if (msg.type === 'ERROR') {
      if (msg.code === 'ROOM_NOT_FOUND') {
        clearTabSession();
        setLandingError(msg.message);
        setHasJoinedRoom(false);
        setGameStarted(false);
        setConnectedPlayers([]);
      } else {
        setBannerAlert({ message: msg.message, type: 'error' });
      }
    }
  };

  // Keep latest join metadata in refs so server-side name disambiguation never tears down the socket
  const playerNameRef = useRef<string>(playerName);
  playerNameRef.current = playerName;
  const initialHostPasswordRef = useRef<string>(initialHostPassword);
  initialHostPasswordRef.current = initialHostPassword;
  const initialCustomSetupRef = useRef<CustomGameSetup | undefined>(initialCustomSetup);
  initialCustomSetupRef.current = initialCustomSetup;
  const isCreatingRoomRef = useRef<boolean>(isCreatingRoom);
  isCreatingRoomRef.current = isCreatingRoom;

  // Connect to backend WebSocket with heartbeat, auto-reconnect, and HTTP fallback sync
  useEffect(() => {
    if (!hasJoinedRoom || !isOnlineMode || !roomCode || !playerNameRef.current) {
      wsConnectedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isUnmounted = false;
    let wsJoined = false;
    let httpJoinAttempted = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectAttempt = 0;

    const joinOverHttpFallback = async () => {
      if (httpJoinAttempted || wsJoined || isUnmounted) return;
      httpJoinAttempted = true;
      try {
        const res = await fetch('/api/room/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            playerName: playerNameRef.current,
            sessionToken,
            archivesPassword: initialHostPasswordRef.current || undefined,
            customSetup: initialCustomSetupRef.current || undefined,
            createIfMissing: isCreatingRoomRef.current,
          }),
        });
        const data = await res.json();
        if (!isUnmounted) {
          applyServerMessage(data);
        }
      } catch (err) {
        console.warn('HTTP room join fallback error:', err);
      }
    };

    const pollRoomSync = async () => {
      try {
        const res = await fetch(
          `/api/room/${encodeURIComponent(roomCode)}/sync?sessionToken=${encodeURIComponent(sessionToken)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!isUnmounted) applyServerMessage(data);
        } else if (res.status === 404 && !wsConnectedRef.current) {
          httpJoinAttempted = false;
          await joinOverHttpFallback();
        }
      } catch {
        // Ignore transient poll errors
      }
    };

    const connectWebSocket = () => {
      if (isUnmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        wsConnectedRef.current = true;
        reconnectAttempt = 0;
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode,
            playerName: playerNameRef.current,
            sessionToken,
            archivesPassword: initialHostPasswordRef.current || undefined,
            customSetup: initialCustomSetupRef.current || undefined,
            createIfMissing: isCreatingRoomRef.current,
          })
        );
        // Keepalive ping every 15s to prevent Cloud Run / proxy idle disconnects
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PONG') return;
          if (msg.type === 'JOINED_SUCCESS' || msg.type === 'SYNC_STATE') {
            wsJoined = true;
          }
          applyServerMessage(msg);
        } catch (e) {
          console.error('Error handling message:', e);
        }
      };

      ws.onerror = () => {
        wsConnectedRef.current = false;
        joinOverHttpFallback();
      };

      ws.onclose = () => {
        wsConnectedRef.current = false;
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        if (!isUnmounted) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempt), 6000);
          reconnectAttempt++;
          reconnectTimer = setTimeout(connectWebSocket, delay);
        }
      };
    };

    connectWebSocket();

    // If WebSocket hasn't completed join within 900ms, register over HTTP immediately
    fallbackTimer = setTimeout(() => {
      if (!wsJoined) {
        joinOverHttpFallback();
      }
    }, 900);

    // Safety-net HTTP sync poll every 2.5s when WS isn't connected OR while in the pre-game lobby
    pollInterval = setInterval(() => {
      if (!wsConnectedRef.current || !gameStartedRef.current) {
        pollRoomSync();
      }
    }, 2500);

    return () => {
      isUnmounted = true;
      wsConnectedRef.current = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (pingInterval) clearInterval(pingInterval);
      if (pollInterval) clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [hasJoinedRoom, isOnlineMode, roomCode, sessionToken]);

  // Helper to send action to server (WebSocket primary, HTTP fallback when online)
  const sendAction = (type: string, payload: any = {}) => {
    if (!isOnlineMode) return false;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, roomCode, sessionToken, ...payload }));
      return true;
    }

    // Fallback over HTTP REST when online so actions never drop silently
    if (hasJoinedRoom && roomCode) {
      fetch(`/api/room/${encodeURIComponent(roomCode)}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, sessionToken, ...payload }),
      })
        .then((res) => res.json())
        .then((data) => applyServerMessage(data))
        .catch((err) => console.warn('HTTP action fallback error:', err));
      return true;
    }

    return false;
  };

  const handleJoinFromLanding = (
    enteredName: string,
    enteredCode: string,
    archivesPassword?: string,
    customSetup?: CustomGameSetup,
    isHostingRoom?: boolean
  ) => {
    const freshTok = generateFreshSessionToken();
    const hostingFlag = Boolean(isHostingRoom);
    setLandingError('');
    setSessionToken(freshTok);
    setPlayerName(enteredName);
    setRoomCode(enteredCode);
    setIsCreatingRoom(hostingFlag);
    if (customSetup) {
      setInitialCustomSetup(customSetup);
    } else {
      setInitialCustomSetup(undefined);
    }
    if (archivesPassword) {
      setInitialHostPassword(archivesPassword);
      setHostArchivesPassword(archivesPassword);
    } else {
      setInitialHostPassword('');
      setHostArchivesPassword('');
    }
    safeStorage.setItem('blinds_player_name', enteredName);
    safeStorage.setItem('blinds_room_code', enteredCode);
    saveTabSession({
      sessionToken: freshTok,
      roomCode: enteredCode,
      playerName: enteredName,
      isCreatingRoom: hostingFlag,
      archivesPassword,
      customSetup,
    });

    // Update URL query param to reflect room
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set('room', enteredCode);
      window.history.pushState({}, '', url);
    } catch {
      // Ignore if history state cannot be pushed
    }

    setHasJoinedRoom(true);
  };

  const requestLeaveRoom = () => {
    setIsLeaveConfirmOpen(true);
  };

  const handleConfirmLeaveRoom = () => {
    setIsLeaveConfirmOpen(false);
    sendAction('LEAVE_ROOM');
    clearTabSession();
    setHasJoinedRoom(false);
    setGameStarted(false);
    setShowArchivesView(false);
    setIsArchives(false);
    setIsHost(false);
    setMyPlayerId('p1');
    setConnectedPlayers([]);
    setInitialCustomSetup(undefined);
    setInitialHostPassword('');
    setHostArchivesPassword('');
    setInitialRoomFromUrl('');
    setRoomCode('');
    setLandingError('');
    setSessionToken(generateFreshSessionToken());
    try {
      const url = new URL(window.location.origin);
      window.history.pushState({}, '', url);
    } catch {}
  };

  const activePlayer = gameState.players.find((p) => p.id === gameState.activePlayerId) || gameState.players[0];
  const otherPlayers = gameState.players.filter((p) => p.id !== activePlayer.id);

  // Timer Tick
  useEffect(() => {
    if (!gameState.isTimerRunning || gameState.isGameOver) return;
    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.roundTimeRemainingSeconds <= 1) {
          return {
            ...prev,
            roundTimeRemainingSeconds: 0,
            isTimerRunning: false,
          };
        }
        return {
          ...prev,
          roundTimeRemainingSeconds: prev.roundTimeRemainingSeconds - 1,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.isTimerRunning, gameState.isGameOver]);

  // Handle Create Room from modal
  const handleCreateRoom = (newRoom: string, newName: string, setup?: CustomGameSetup) => {
    sendAction('LEAVE_ROOM');
    const freshTok = generateFreshSessionToken();
    setSessionToken(freshTok);
    setConnectedPlayers([]);
    setIsCreatingRoom(true);
    setRoomCode(newRoom);
    setPlayerName(newName);
    if (setup) {
      setInitialCustomSetup(setup);
    }
    setIsOnlineMode(true);
    setGameStarted(false);
    safeStorage.setItem('blinds_player_name', newName);
    saveTabSession({
      sessionToken: freshTok,
      roomCode: newRoom,
      playerName: newName,
      isCreatingRoom: true,
      customSetup: setup,
    });

    // Update URL without reload
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set('room', newRoom);
      window.history.pushState({}, '', url);
    } catch {}

    setBannerAlert({
      message: `Created Room "${newRoom}"! Share the invite link with friends to join.`,
      type: 'success',
    });
  };

  // Handle Join Room from modal
  const handleJoinRoom = (newRoom: string, newName: string) => {
    sendAction('LEAVE_ROOM');
    const freshTok = generateFreshSessionToken();
    setSessionToken(freshTok);
    setConnectedPlayers([]);
    setIsCreatingRoom(false);
    setInitialHostPassword('');
    setHostArchivesPassword('');
    setRoomCode(newRoom);
    setPlayerName(newName);
    setIsOnlineMode(true);
    setGameStarted(false);
    safeStorage.setItem('blinds_player_name', newName);
    saveTabSession({
      sessionToken: freshTok,
      roomCode: newRoom,
      playerName: newName,
      isCreatingRoom: false,
    });

    try {
      const url = new URL(window.location.origin);
      url.searchParams.set('room', newRoom);
      window.history.pushState({}, '', url);
    } catch {}

    setBannerAlert({
      message: `Connecting to Room "${newRoom}" as ${newName}... You will only see your own private screen.`,
      type: 'info',
    });
  };

  const handleStartGame = () => {
    sendAction('START_GAME');
    setGameStarted(true);
    setGameState((prev) => ({ ...prev, isTimerRunning: true }));
  };

  const handleNewGame = () => {
    if (!sendAction('RESET_GAME')) {
      const initial = createInitialGame({
        roomCode,
        playerCount: initialCustomSetup?.playerCount || gameState.playerCount,
        characterOverride: initialCustomSetup?.characterOverride,
        powerOverride: initialCustomSetup?.powerOverride,
      });
      initial.isTimerRunning = true;
      setGameState(initial);
    }
    setBannerAlert({ message: 'New game started! Round 1 is live.', type: 'info' });
  };

  const handleToggleTimer = () => {
    if (!sendAction('TOGGLE_TIMER', { isRunning: !gameState.isTimerRunning })) {
      setGameState((prev) => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
    }
  };

  const handleSwitchActivePlayer = (playerId: string) => {
    if (isOnlineMode) {
      // In online mode, privacy prevents viewing another player's private screen!
      setBannerAlert({
        message: 'In Online Multiplayer, you can only see your own screen! Opponent screens are private.',
        type: 'warn',
      });
      return;
    }
    setGameState((prev) => ({ ...prev, activePlayerId: playerId }));
    setBannerAlert(null);
  };

  const handleAskQuestion = (req: QuestionRequest) => {
    if (!sendAction('ASK_QUESTION', { request: req })) {
      const res = askQuestion(gameState, req);
      if (!res.success) {
        setBannerAlert({ message: res.error || 'Failed to ask question.', type: 'error' });
        return;
      }
      setGameState(res.state);
    }
    setBannerAlert({
      message: req.isPublic
        ? 'Public question asked! Logged to table (+1 point).'
        : 'Private question answered secretly to you.',
      type: 'success',
    });
  };

  const handleBuyBonusToken = () => {
    if (!sendAction('BUY_TOKEN')) {
      const res = buyBonusToken(gameState, gameState.activePlayerId);
      if (!res.success) {
        setBannerAlert({ message: res.error || 'Failed to buy token.', type: 'error' });
        return;
      }
      setGameState(res.state);
    }
    setBannerAlert({ message: 'Bought 1 Bonus Question Token for −3 points penalty.', type: 'warn' });
  };

  const handleSubmitGuess = (targetPlayerId: string, suit: Suit, value: CardValue, isGambit?: boolean) => {
    if (!sendAction('SUBMIT_GUESS', { targetPlayerId, suit, value, isGambit })) {
      const res = submitOrEditGuess(
        gameState,
        gameState.activePlayerId,
        targetPlayerId,
        suit,
        value,
        isGambit
      );
      if (!res.success) {
        setBannerAlert({ message: res.error || 'Failed to submit guess.', type: 'error' });
        return;
      }
      setGameState(res.state);
    }
    setBannerAlert({
      message: isGambit
        ? 'Guess locked in as an Angad Gambit! Resolves at round end.'
        : 'Round guess locked in! You may edit it before resolution.',
      type: 'success',
    });
  };

  const handleActivatePower = (targetPlayerId?: string) => {
    if (!sendAction('ACTIVATE_POWER', { targetPlayerId })) {
      const res = activatePower(gameState, gameState.activePlayerId, targetPlayerId);
      if (!res.success) {
        setBannerAlert({ message: res.message, type: 'error' });
        return;
      }
      setGameState(res.state);
      setBannerAlert({ message: res.message, type: 'success' });
    }
  };

  const handleEquipPower = (powerId: PowerId) => {
    if (!sendAction('EQUIP_POWER', { powerId })) {
      const res = equipPower(gameState, gameState.activePlayerId, powerId);
      setGameState(res.state);
    }
    setBannerAlert({ message: `Equipped ${powerId}! Power is ready on your card.`, type: 'success' });
  };

  const handleEquipCharacter = (characterId: CharacterId) => {
    if (!sendAction('EQUIP_CHARACTER', { characterId })) {
      const res = equipCharacter(gameState, gameState.activePlayerId, characterId);
      setGameState(res.state);
    }
    setBannerAlert({ message: `Switched character to ${characterId}!`, type: 'success' });
  };

  const handleLaunchQuestionWithTenHeads = () => {
    setIsPowerModalOpen(false);
    setIsPowerLabOpen(false);
    setQuestionWithTenHeads(true);
    setIsQuestionModalOpen(true);
  };

  const handleSimulateBots = () => {
    if (!sendAction('SIMULATE_BOTS')) {
      const updated = autoPlayAllBots(gameState);
      setGameState(updated);
    }
    setBannerAlert({
      message: 'All bots have taken their questions and locked in their round guesses!',
      type: 'info',
    });
  };

  const handleResolveRound = () => {
    if (!sendAction('RESOLVE_ROUND')) {
      let stateBeforeResolve = gameState;
      const botsWithoutGuess = stateBeforeResolve.players.filter(
        (p) => p.isBot && !p.submittedGuess && !p.nagpashBlockedThisRound
      );
      if (botsWithoutGuess.length > 0) {
        stateBeforeResolve = autoPlayAllBots(stateBeforeResolve);
      }
      const resolved = resolveRoundGuesses(stateBeforeResolve);
      setGameState(resolved);
      setIsResolutionModalOpen(true);
    } else {
      setIsResolutionModalOpen(true);
    }
  };

  const handleAdvanceRound = () => {
    if (!sendAction('ADVANCE_ROUND')) {
      const advanced = advanceToNextRound(gameState);
      setGameState(advanced);
      if (advanced.isGameOver) {
        setIsFinalScoreModalOpen(true);
      }
    }
    setBannerAlert({
      message: gameState.round >= 4 ? 'Game ended! Calculating final scores.' : `Moved to Round ${gameState.round + 1}.`,
      type: 'info',
    });
  };

  const handleSelectShabariSuit = (suit: Suit) => {
    if (!sendAction('SELECT_SHABARI_SUIT', { suit })) {
      setGameState(setShabariSuit(gameState, gameState.activePlayerId, suit));
    }
    setBannerAlert({ message: `Shabari chosen suit set to ${suit}.`, type: 'info' });
  };

  const handleQuickAsk = (targetId: string) => {
    setModalDefaultTargetId(targetId);
    setIsQuestionModalOpen(true);
  };

  const handleQuickGuess = (targetId: string) => {
    setModalDefaultTargetId(targetId);
    setIsGuessModalOpen(true);
  };

  const handleCycleCardTag = (cardKey: string) => {
    if (!sendAction('CYCLE_CARD_TAG', { cardKey })) {
      setGameState(cycleCardTag(gameState, gameState.activePlayerId, cardKey));
    }
  };

  const handleToggleCardTagMode = (cardKey: string) => {
    if (!sendAction('TOGGLE_CARD_TAG_MODE', { cardKey })) {
      setGameState(toggleCardTagMode(gameState, gameState.activePlayerId, cardKey));
    }
  };

  const handleSetCardTag = (
    cardKey: string,
    tag: { player: string; mode: 'suspect' | 'not' } | null
  ) => {
    if (!sendAction('SET_CARD_TAG', { cardKey, tag })) {
      setGameState(setCardTag(gameState, gameState.activePlayerId, cardKey, tag));
    }
  };

  const finalScores = computeFinalScores(
    gameState.players,
    gameState.sugrivaSharedCount,
    gameState.playerRunningPoints
  );

  // 1. Landing Screen (shown when user opens published link)
  if (!hasJoinedRoom) {
    return (
      <>
        <LandingScreen
          initialCode={initialRoomFromUrl || roomCode}
          externalError={landingError}
          onClearExternalError={() => setLandingError('')}
          onJoin={handleJoinFromLanding}
          onOpenRules={() => setIsRulesModalOpen(true)}
        />
        <RulesReferenceModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          onOpenPowerLab={() => setIsPowerLabOpen(true)}
        />
        <PowerTestLabModal
          isOpen={isPowerLabOpen}
          activePowerId={activePlayer.powerId}
          activeCharacterId={activePlayer.characterId}
          onClose={() => setIsPowerLabOpen(false)}
          onEquipPower={handleEquipPower}
          onEquipCharacter={handleEquipCharacter}
          onLaunchTenHeadsComposer={handleLaunchQuestionWithTenHeads}
        />
      </>
    );
  }

  // 2. Pre-Game Lobby Screen (Host & Joined Players see real-time connected roster and seats)
  if (hasJoinedRoom && !gameStarted) {
    if (showArchivesView) {
      return (
        <>
          <TheArchivesView
            state={gameState}
            gameStarted={false}
            myPlayerId={myPlayerId}
            myPlayerName={playerName}
            isHost={isHost}
            hasPlayerSeat={myPlayerId !== 'spectator'}
            onSwitchToPlayerMat={() => setShowArchivesView(false)}
            onLeaveRoom={requestLeaveRoom}
            onResolveRound={handleResolveRound}
            onAdvanceRound={handleAdvanceRound}
            onSimulateBots={handleSimulateBots}
            onNewGame={handleNewGame}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onStartGame={handleStartGame}
          />
          <LeaveConfirmModal
            isOpen={isLeaveConfirmOpen}
            roomCode={roomCode}
            gameStarted={false}
            isHost={isHost}
            onConfirm={handleConfirmLeaveRoom}
            onCancel={() => setIsLeaveConfirmOpen(false)}
          />
        </>
      );
    }

    const displayList: ConnectedPlayer[] =
      connectedPlayers.length > 0
        ? connectedPlayers
        : [{ id: myPlayerId || activePlayer.id, name: playerName, isHost }];

    return (
      <>
        <LobbyScreen
          roomCode={roomCode}
          myPlayerName={playerName}
          myPlayerId={myPlayerId}
          isHost={isHost}
          isArchives={isArchives}
          playerCount={gameState.playerCount || 8}
          customSetup={initialCustomSetup}
          hostArchivesPassword={hostArchivesPassword}
          connectedPlayers={displayList}
          onStartGame={handleStartGame}
          onLeaveRoom={requestLeaveRoom}
          onOpenRules={() => setIsRulesModalOpen(true)}
          onSelectSeat={(seatId) => sendAction('SELECT_SEAT', { seatId })}
          onUnlockArchives={(password, relinquishSeat) =>
            sendAction('UNLOCK_ARCHIVES', { password, relinquishSeat })
          }
          onOpenArchives={() => setShowArchivesView(true)}
          onUpdateArchivesPassword={(password) =>
            sendAction('UPDATE_ARCHIVES_PASSWORD', { password })
          }
          onUpdateRoomSetup={(setup) => {
            setInitialCustomSetup(setup);
            sendAction('UPDATE_ROOM_SETUP', setup);
          }}
        />
        <RulesReferenceModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          onOpenPowerLab={() => setIsPowerLabOpen(true)}
        />
        <LeaveConfirmModal
          isOpen={isLeaveConfirmOpen}
          roomCode={roomCode}
          gameStarted={false}
          isHost={isHost}
          onConfirm={handleConfirmLeaveRoom}
          onCancel={() => setIsLeaveConfirmOpen(false)}
        />
      </>
    );
  }

  // If spectator or user specifically toggled into The Archives during the active game
  if (hasJoinedRoom && (showArchivesView || myPlayerId === 'spectator')) {
    return (
      <>
        <TheArchivesView
          state={gameState}
          gameStarted={gameStarted}
          myPlayerId={myPlayerId}
          myPlayerName={playerName}
          isHost={isHost}
          hasPlayerSeat={myPlayerId !== 'spectator'}
          onSwitchToPlayerMat={() => setShowArchivesView(false)}
          onLeaveRoom={requestLeaveRoom}
          onResolveRound={handleResolveRound}
          onAdvanceRound={handleAdvanceRound}
          onSimulateBots={handleSimulateBots}
          onNewGame={handleNewGame}
          onOpenRules={() => setIsRulesModalOpen(true)}
          onStartGame={handleStartGame}
        />
        <LeaveConfirmModal
          isOpen={isLeaveConfirmOpen}
          roomCode={roomCode}
          gameStarted={gameStarted}
          isHost={isHost}
          onConfirm={handleConfirmLeaveRoom}
          onCancel={() => setIsLeaveConfirmOpen(false)}
        />
      </>
    );
  }

  // 3. Active Game Screen
  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans selection:bg-slate-800 selection:text-white">
      {/* Header */}
      <Header
        state={gameState}
        isOnlineMode={isOnlineMode}
        playerName={playerName}
        isHost={isHost}
        isArchives={isArchives}
        onOpenArchives={() => setShowArchivesView(true)}
        onUnlockArchivesPrompt={() => setIsArchivesPromptOpen(true)}
        onLeaveRoom={requestLeaveRoom}
        onNewGame={handleNewGame}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenTests={() => setIsTestsModalOpen(true)}
        onOpenPowerLab={() => setIsPowerLabOpen(true)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onOpenSubmittedGuesses={() => setIsSubmittedGuessesModalOpen(true)}
        onToggleTimer={handleToggleTimer}
        onSwitchActivePlayer={handleSwitchActivePlayer}
        onResolveRound={handleResolveRound}
        onAdvanceRound={handleAdvanceRound}
        onSimulateBots={handleSimulateBots}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner Alert */}
        {bannerAlert && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 ${
              bannerAlert.type === 'error'
                ? 'bg-red-950/60 border-red-500/40 text-red-200'
                : bannerAlert.type === 'warn'
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                : bannerAlert.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-850 border-slate-700 text-slate-200'
            }`}
          >
            <span>{bannerAlert.message}</span>
            <button
              onClick={() => setBannerAlert(null)}
              className="text-slate-400 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs: Player vs Deduction */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveMainTab('player')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'player'
                ? 'bg-[#182133] text-slate-100 border border-slate-750 shadow-xs'
                : 'bg-[#0e1320] text-slate-400 hover:text-slate-200 hover:bg-[#141b2a] border border-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Player Mat</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeMainTab === 'player'
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-850 text-slate-400'
              }`}
            >
              {activePlayer.questionTokens} Tokens
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('deduction')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'deduction'
                ? 'bg-[#182133] text-slate-100 border border-slate-750 shadow-xs'
                : 'bg-[#0e1320] text-slate-400 hover:text-slate-200 hover:bg-[#141b2a] border border-slate-800'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Deduction Ledger & Table</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeMainTab === 'deduction'
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-850 text-slate-400'
              }`}
            >
              {gameState.centralCards.filter((c) => c.isRevealed).length +
                gameState.players.reduce((acc, p) => acc + p.cards.filter((c) => c.isRevealed).length, 0)}{' '}
              Revealed
            </span>
          </button>
        </div>

        {/* Tab 1: Player Information & Actions */}
        {activeMainTab === 'player' ? (
          <PlayerMat
            player={activePlayer}
            allPlayers={gameState.players}
            centralCards={gameState.centralCards}
            questionLogs={gameState.questionLogs}
            sugrivaSharedCount={gameState.sugrivaSharedCount}
            currentRound={gameState.round}
            baseGuessPoints={gameState.playerRunningPoints[activePlayer.id] || 0}
            isHost={isHost}
            roundGuessesResolved={gameState.roundGuessesResolved}
            onOpenQuestionModal={() => {
              setModalDefaultTargetId(undefined);
              setIsQuestionModalOpen(true);
            }}
            onOpenGuessModal={() => {
              setModalDefaultTargetId(undefined);
              setIsGuessModalOpen(true);
            }}
            onOpenPowerModal={() => setIsPowerModalOpen(true)}
            onOpenPowerLab={() => setIsPowerLabOpen(true)}
            onOpenQuestionWithTenHeads={handleLaunchQuestionWithTenHeads}
            onBuyBonusToken={handleBuyBonusToken}
            onSelectShabariSuit={handleSelectShabariSuit}
            onOpenSubmittedGuesses={() => setIsSubmittedGuessesModalOpen(true)}
            onResolveRound={handleResolveRound}
            onAdvanceRound={handleAdvanceRound}
            onSimulateBots={handleSimulateBots}
            onNewGame={handleNewGame}
          />
        ) : (
          /* Tab 2: Deduction Grid & All Revealed Info on Players */
          <GameBoard
            me={activePlayer}
            allPlayers={gameState.players}
            otherPlayers={otherPlayers}
            centralCards={gameState.centralCards}
            questionLogs={gameState.questionLogs}
            activePlayerId={gameState.activePlayerId}
            currentRound={gameState.round}
            playerCount={gameState.playerCount || (gameState.players.length === 6 ? 6 : 8)}
            onAskPlayer={handleQuickAsk}
            onGuessPlayer={handleQuickGuess}
            onCycleCardTag={handleCycleCardTag}
            onToggleCardTagMode={handleToggleCardTagMode}
            onSetCardTag={handleSetCardTag}
          />
        )}

        {/* Logs Feed & Quick Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <LogFeed
              gameLogs={gameState.gameLogs}
              questionLogs={gameState.questionLogs}
              activePlayerId={gameState.activePlayerId}
            />
          </div>

          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between text-xs shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-300 font-serif text-sm">
                  Diwali Quick Reference
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                  {isOnlineMode ? '🔒 Private View' : 'Pass & Play'}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px] mb-3">
                Each player's screen is strictly isolated. You only see your own cards, character, power, and private notices.
              </p>

              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Share Link:</span>
                  <button
                    onClick={() => setIsRoomModalOpen(true)}
                    className="text-amber-400 font-semibold hover:underline"
                  >
                    Invite Friends ({roomCode})
                  </button>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Public Question:</span>
                  <span className="font-semibold text-amber-400">+1 point to asker</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Bonus Token:</span>
                  <span className="font-semibold text-red-400">−3 points penalty</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Angad Gambit:</span>
                  <span className="font-semibold text-purple-300">+3 correct / −3 miss</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Survival at End:</span>
                  <span className="font-semibold text-emerald-400">Own: +2/+5 • Partner: +2/+3</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>Full Rulebook & Character Guide</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <RoomModal
        isOpen={isRoomModalOpen}
        roomCode={roomCode}
        playerName={playerName}
        isHost={isHost}
        gameStarted={gameStarted}
        connectedPlayersCount={
          connectedPlayers.length > 0
            ? connectedPlayers.filter((p) => !p.isSpectator).length
            : gameState.players.filter((p) => !p.isBot).length
        }
        connectedPlayers={
          connectedPlayers.length > 0
            ? connectedPlayers.filter((p) => !p.isSpectator)
            : gameState.players
                .filter((p) => !p.isBot)
                .map((p) => ({ id: p.id, name: p.name, isHost: p.id === 'p1' }))
        }
        totalSeats={gameState.playerCount || (gameState.players.length === 6 ? 6 : 8)}
        isOnlineMode={isOnlineMode}
        initialTab={initialRoomFromUrl ? 'join' : 'share'}
        onClose={() => setIsRoomModalOpen(false)}
        onStartGame={handleStartGame}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        onLeaveRoom={requestLeaveRoom}
        onSwitchToSolo={() => {
          setIsOnlineMode(false);
          setBannerAlert({
            message: 'Switched to Pass-and-Play Solo mode. You can now toggle between all players.',
            type: 'info',
          });
        }}
      />

      <QuestionComposer
        isOpen={isQuestionModalOpen}
        asker={activePlayer}
        otherPlayers={otherPlayers}
        defaultTargetId={modalDefaultTargetId}
        initialTenHeads={questionWithTenHeads}
        playerCount={gameState.playerCount || (gameState.players.length === 6 ? 6 : 8)}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setQuestionWithTenHeads(false);
        }}
        onSubmit={handleAskQuestion}
      />

      <GuessModal
        isOpen={isGuessModalOpen}
        guesser={activePlayer}
        otherPlayers={otherPlayers}
        defaultTargetId={modalDefaultTargetId}
        currentRound={gameState.round}
        playerCount={gameState.playerCount || (gameState.players.length === 6 ? 6 : 8)}
        onClose={() => setIsGuessModalOpen(false)}
        onSubmitGuess={handleSubmitGuess}
      />

      <PowerModal
        isOpen={isPowerModalOpen}
        user={activePlayer}
        otherPlayers={otherPlayers}
        onClose={() => setIsPowerModalOpen(false)}
        onActivate={handleActivatePower}
        onOpenQuestionWithTenHeads={handleLaunchQuestionWithTenHeads}
        onOpenPowerLab={() => setIsPowerLabOpen(true)}
      />

      <PowerTestLabModal
        isOpen={isPowerLabOpen}
        activePowerId={activePlayer.powerId}
        activeCharacterId={activePlayer.characterId}
        onClose={() => setIsPowerLabOpen(false)}
        onEquipPower={handleEquipPower}
        onEquipCharacter={handleEquipCharacter}
        onLaunchTenHeadsComposer={handleLaunchQuestionWithTenHeads}
      />

      <SubmittedGuessesModal
        isOpen={isSubmittedGuessesModalOpen}
        players={gameState.players}
        currentRound={gameState.round}
        isHost={isHost}
        roundGuessesResolved={gameState.roundGuessesResolved}
        onClose={() => setIsSubmittedGuessesModalOpen(false)}
        onResolveRound={handleResolveRound}
        onAdvanceRound={handleAdvanceRound}
        onSimulateBots={handleSimulateBots}
      />

      <RoundResolutionModal
        isOpen={isResolutionModalOpen}
        result={gameState.lastResolutionResult}
        players={gameState.players}
        activePlayerId={gameState.activePlayerId}
        isHost={isHost}
        isGameOver={gameState.isGameOver}
        currentRound={gameState.round}
        onClose={() => {
          setIsResolutionModalOpen(false);
          if (gameState.isGameOver) {
            setIsFinalScoreModalOpen(true);
          }
        }}
        onAdvanceRound={handleAdvanceRound}
      />

      <FinalScoreboardModal
        isOpen={isFinalScoreModalOpen}
        scores={finalScores}
        players={gameState.players}
        onLeaveRoom={requestLeaveRoom}
        onNewGame={() => {
          setIsFinalScoreModalOpen(false);
          handleNewGame();
        }}
      />

      <RulesReferenceModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onOpenPowerLab={() => setIsPowerLabOpen(true)}
      />

      <AcceptanceTestsModal
        isOpen={isTestsModalOpen}
        onClose={() => setIsTestsModalOpen(false)}
      />

      <LeaveConfirmModal
        isOpen={isLeaveConfirmOpen}
        roomCode={roomCode}
        gameStarted={gameStarted}
        isHost={isHost}
        onConfirm={handleConfirmLeaveRoom}
        onCancel={() => setIsLeaveConfirmOpen(false)}
      />

      {/* Mid-Game Archives Unlock Prompt */}
      {isArchivesPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#131926] border border-amber-600/50 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-300">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-amber-200">
                  Unlock The Archives
                </h3>
                <p className="text-[10px] text-slate-400">
                  Host & Facilitator Protected View
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!archivesPromptPassword.trim()) {
                  setArchivesPromptError('Please enter password.');
                  return;
                }
                setArchivesPromptError('');
                sendAction('UNLOCK_ARCHIVES', {
                  password: archivesPromptPassword.trim(),
                  relinquishSeat: false,
                });
                setIsArchivesPromptOpen(false);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Facilitator Password:
                </label>
                <input
                  type="password"
                  autoFocus
                  value={archivesPromptPassword}
                  onChange={(e) => {
                    setArchivesPromptPassword(e.target.value);
                    if (archivesPromptError) setArchivesPromptError('');
                  }}
                  placeholder="Enter password"
                  className="w-full bg-[#1b2334] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all font-mono"
                />
              </div>

              {archivesPromptError && (
                <div className="text-xs text-rose-400 font-medium">
                  {archivesPromptError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsArchivesPromptOpen(false);
                    setArchivesPromptError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Unlock Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
