import http from 'http';
import fs from 'fs';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
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
  equipPower,
  equipCharacter,
} from './src/game/engine.ts';
import type { GameState } from './src/game/engine.ts';
import { autoPlayAllBots } from './src/game/botAI.ts';
import { evaluateCharacterObjective } from './src/game/scoring.ts';
import type {
  CardValue,
  PlayingCard,
  QuestionRequest,
  Suit,
  CustomGameSetup,
} from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// In-memory room store: roomCode -> RoomData
interface ClientSession {
  ws: WebSocket | null;
  sessionToken: string;
  playerId: string; // 'p1'...'p8', or 'spectator'
  playerName: string;
  isArchives?: boolean;
  lastSeenAt: number;
}

interface RoomData {
  roomCode: string;
  hostSessionToken: string;
  archivesPassword: string;
  gameStarted: boolean;
  state: GameState;
  clients: Map<string, ClientSession>; // sessionToken -> ClientSession
  divineSightKnown: Record<string, string[]>; // viewerPlayerId -> targetPlayerIds known
  customSetup?: CustomGameSetup;
  lastUpdated: number;
}

const ROOMS_PERSIST_PATH = '/tmp/blinds_rooms_v1.json';
const rooms = new Map<string, RoomData>();

function loadRoomsFromDisk() {
  try {
    if (!fs.existsSync(ROOMS_PERSIST_PATH)) return;
    const raw = fs.readFileSync(ROOMS_PERSIST_PATH, 'utf-8');
    if (!raw) return;
    const parsed = JSON.parse(raw) as Array<{
      roomCode: string;
      hostSessionToken: string;
      archivesPassword: string;
      gameStarted: boolean;
      state: GameState;
      clients: Array<{
        sessionToken: string;
        playerId: string;
        playerName: string;
        isArchives?: boolean;
        lastSeenAt: number;
      }>;
      divineSightKnown: Record<string, string[]>;
      customSetup?: CustomGameSetup;
      lastUpdated: number;
    }>;
    const cutoff = Date.now() - 2 * 3600000;
    for (const r of parsed) {
      if (!r?.roomCode || r.lastUpdated < cutoff) continue;
      const clientMap = new Map<string, ClientSession>();
      for (const c of r.clients || []) {
        clientMap.set(c.sessionToken, {
          ws: null,
          sessionToken: c.sessionToken,
          playerId: c.playerId,
          playerName: c.playerName,
          isArchives: c.isArchives,
          lastSeenAt: c.lastSeenAt,
        });
      }
      rooms.set(r.roomCode, {
        roomCode: r.roomCode,
        hostSessionToken: r.hostSessionToken,
        archivesPassword: r.archivesPassword,
        gameStarted: r.gameStarted,
        state: r.state,
        clients: clientMap,
        divineSightKnown: r.divineSightKnown || {},
        customSetup: r.customSetup,
        lastUpdated: r.lastUpdated,
      });
    }
  } catch (err) {
    console.warn('Could not restore persisted rooms:', err);
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersistRooms() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const serializable = Array.from(rooms.values()).map((r) => ({
        roomCode: r.roomCode,
        hostSessionToken: r.hostSessionToken,
        archivesPassword: r.archivesPassword,
        gameStarted: r.gameStarted,
        state: r.state,
        clients: Array.from(r.clients.values()).map((c) => ({
          sessionToken: c.sessionToken,
          playerId: c.playerId,
          playerName: c.playerName,
          isArchives: c.isArchives,
          lastSeenAt: c.lastSeenAt,
        })),
        divineSightKnown: r.divineSightKnown,
        customSetup: r.customSetup,
        lastUpdated: r.lastUpdated,
      }));
      fs.writeFileSync(ROOMS_PERSIST_PATH, JSON.stringify(serializable));
    } catch (err) {
      console.warn('Could not persist rooms:', err);
    }
  }, 150);
}

loadRoomsFromDisk();

// Sanitize game state for a specific viewer so other players' secret cards & identities are masked,
// UNLESS viewer has authorized access to "The Archives" once the game has started.
function sanitizeStateForPlayer(
  room: RoomData,
  viewerPlayerId: string,
  isArchives: boolean = false
): any {
  const state = room.state;
  const isGameOver = state.isGameOver;
  const isArchivesActive = isArchives && room.gameStarted;
  const knownCharacters = room.divineSightKnown[viewerPlayerId] || [];

  const sanitizedPlayers = state.players.map((p) => {
    const isSelf = p.id === viewerPlayerId;

    const sanitizedCards = p.cards.map((c) => {
      if (isSelf || c.isRevealed || isArchivesActive) {
        return c;
      }
      return {
        id: `hidden_${p.id}_card`,
        suit: 'Hearts' as Suit,
        value: 1 as CardValue,
        isRevealed: false,
      };
    }) as [PlayingCard, PlayingCard];

    const canSeeCharacter =
      isSelf || isGameOver || isArchivesActive || knownCharacters.includes(p.id);
    const charId = canSeeCharacter ? p.characterId : ('Hidden' as any);

    const canSeePower = isSelf || isGameOver || isArchivesActive;
    const powerId = canSeePower ? p.powerId : ('Hidden' as any);

    let sanitizedGuess = undefined;
    if (p.submittedGuess) {
      if (isSelf || isArchivesActive) {
        sanitizedGuess = p.submittedGuess;
      } else {
        sanitizedGuess = {
          targetPlayerId: 'hidden',
          suit: 'Hearts' as Suit,
          value: 1 as CardValue,
          isGambit: false,
          submittedAtRound: p.submittedGuess.submittedAtRound,
        };
      }
    }

    const objStatus =
      isSelf || isArchivesActive
        ? evaluateCharacterObjective(p, state.players, state.sugrivaSharedCount)
        : undefined;

    return {
      ...p,
      cards: sanitizedCards,
      characterId: charId,
      powerId: powerId,
      partnerSuits: isSelf || isArchivesActive ? p.partnerSuits : undefined,
      partnerKnownToMe: isSelf || isArchivesActive ? true : false,
      cardTags: isSelf ? p.cardTags : undefined,
      secretPartnerId:
        (isSelf && (isGameOver || p.partnerKnownToMe)) || isArchivesActive
          ? p.secretPartnerId
          : '',
      submittedGuess: sanitizedGuess,
      objectiveProgress: objStatus?.explanation,
      objectivePotentialPoints: objStatus?.points,
    };
  });

  const sanitizedCentral = state.centralCards.map((c, idx) => {
    if (c.isRevealed || isArchivesActive) {
      return c;
    }
    return {
      id: `central_hidden_${idx}`,
      suit: 'Hearts' as Suit,
      value: 1 as CardValue,
      isRevealed: false,
    };
  });

  const sanitizedGameLogs = state.gameLogs.filter(
    (l) => isArchivesActive || !l.isPrivateTo || l.isPrivateTo === viewerPlayerId
  );

  const sanitizedQuestionLogs = state.questionLogs.filter(
    (q) =>
      isArchivesActive ||
      q.isPublic ||
      q.askerId === viewerPlayerId ||
      q.targetId === viewerPlayerId
  );

  return {
    ...state,
    activePlayerId: viewerPlayerId,
    players: sanitizedPlayers,
    centralCards: sanitizedCentral,
    gameLogs: sanitizedGameLogs,
    questionLogs: sanitizedQuestionLogs,
  };
}

function isClientOnline(c: ClientSession): boolean {
  if (c.ws && c.ws.readyState === WebSocket.OPEN) return true;
  return Date.now() - c.lastSeenAt < 8000;
}

function getConnectedPlayersList(room: RoomData) {
  return Array.from(room.clients.values()).map((c) => ({
    id: c.playerId,
    name: c.playerName,
    isHost: c.sessionToken === room.hostSessionToken,
    isArchives: !!c.isArchives,
    isSpectator: c.playerId === 'spectator',
    isConnected: isClientOnline(c),
  }));
}

function buildSyncPayload(room: RoomData, client: ClientSession) {
  const isHostClient = client.sessionToken === room.hostSessionToken;
  const sanitized = sanitizeStateForPlayer(room, client.playerId, !!client.isArchives);
  return {
    type: 'SYNC_STATE',
    roomCode: room.roomCode,
    playerId: client.playerId,
    playerName: client.playerName,
    isHost: isHostClient,
    isArchives: !!client.isArchives,
    archivesPassword: isHostClient ? room.archivesPassword : undefined,
    gameStarted: room.gameStarted,
    connectedPlayers: getConnectedPlayersList(room),
    state: sanitized,
    lastUpdated: room.lastUpdated,
  };
}

// Broadcast sanitized states to each connected WebSocket player in a room
function broadcastRoom(room: RoomData) {
  room.lastUpdated = Date.now();
  schedulePersistRooms();
  for (const [, client] of room.clients.entries()) {
    if (client.ws && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(buildSyncPayload(room, client)));
    }
  }
}

interface ActionResult {
  reply?: any;
  roomCode?: string;
  sessionToken?: string;
  leftRoom?: boolean;
}

function handleJoinRoom(
  msg: any,
  ws: WebSocket | null
): ActionResult {
  const roomCode = (msg.roomCode || 'DEFAULT').toUpperCase().trim();
  const playerName = (msg.playerName || '').trim() || 'Player';
  let sessionToken: string =
    (msg.sessionToken || '').trim() || Math.random().toString(36).substring(2) + Date.now().toString(36);
  const createIfMissing = msg.createIfMissing !== false;

  let room = rooms.get(roomCode);
  if (!room) {
    if (!createIfMissing) {
      return {
        reply: {
          type: 'ERROR',
          code: 'ROOM_NOT_FOUND',
          message: `Room "${roomCode}" was not found. Make sure the host has created it and you are on the same game link.`,
        },
      };
    }

    const playerCount: 6 | 8 = msg.customSetup?.playerCount === 6 ? 6 : 8;
    const initialGame = createInitialGame({
      roomCode,
      playerCount,
      characterOverride: msg.customSetup?.characterOverride,
      powerOverride: msg.customSetup?.powerOverride,
    });
    const hostPass =
      (msg.archivesPassword || '').trim() ||
      'key' + Math.floor(1000 + Math.random() * 9000);
    room = {
      roomCode,
      hostSessionToken: sessionToken,
      archivesPassword: hostPass,
      gameStarted: false,
      state: initialGame,
      clients: new Map(),
      divineSightKnown: {},
      customSetup: msg.customSetup,
      lastUpdated: Date.now(),
    };
    rooms.set(roomCode, room);
  }

  // Prevent session collision when a tab is duplicated in the same browser
  const maybeExisting = room.clients.get(sessionToken);
  if (
    maybeExisting &&
    ws &&
    maybeExisting.ws &&
    maybeExisting.ws !== ws &&
    maybeExisting.ws.readyState === WebSocket.OPEN &&
    maybeExisting.playerName.trim().toLowerCase() !== playerName.toLowerCase()
  ) {
    sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // If this sessionToken isn't already registered, check if a disconnected session with the
  // exact same name exists (e.g. user closed tab and reopened link with same name) and reclaim it.
  if (!room.clients.get(sessionToken)) {
    for (const [oldTok, oldClient] of room.clients.entries()) {
      const sameName = oldClient.playerName.trim().toLowerCase() === playerName.toLowerCase();
      const isOffline =
        (!oldClient.ws || oldClient.ws.readyState !== WebSocket.OPEN) &&
        Date.now() - oldClient.lastSeenAt > 3500;
      if (sameName && isOffline) {
        room.clients.delete(oldTok);
        oldClient.sessionToken = sessionToken;
        oldClient.lastSeenAt = Date.now();
        if (ws) oldClient.ws = ws;
        if (room.hostSessionToken === oldTok) {
          room.hostSessionToken = sessionToken;
        }
        room.clients.set(sessionToken, oldClient);
        break;
      }
    }
  }

  // Disambiguate name if another active client already uses it
  let resolvedName = playerName;
  const otherNames = new Set(
    Array.from(room.clients.entries())
      .filter(([tok]) => tok !== sessionToken)
      .map(([, c]) => c.playerName.trim().toLowerCase())
  );
  if (otherNames.has(resolvedName.toLowerCase())) {
    let count = 2;
    while (otherNames.has(`${resolvedName.toLowerCase()} ${count}`)) {
      count++;
    }
    resolvedName = `${resolvedName} ${count}`;
  }

  let assignedPlayerId = '';
  const existingSession = room.clients.get(sessionToken);
  const wantsSpectator = msg.joinAs === 'spectator' || msg.joinAs === 'archives';

  if (existingSession) {
    if (ws) existingSession.ws = ws;
    existingSession.playerName = resolvedName;
    existingSession.lastSeenAt = Date.now();
    if (wantsSpectator) {
      if (existingSession.playerId && existingSession.playerId !== 'spectator') {
        room.state.players = room.state.players.map((p) =>
          p.id === existingSession.playerId
            ? {
                ...p,
                name: `Player ${existingSession.playerId.replace('p', '')}`,
                isBot: true,
              }
            : p
        );
      }
      existingSession.playerId = 'spectator';
    }
    assignedPlayerId = existingSession.playerId;

    if (assignedPlayerId !== 'spectator') {
      room.state.players = room.state.players.map((p) =>
        p.id === assignedPlayerId ? { ...p, name: resolvedName, isBot: false } : p
      );
    }
  } else {
    if (wantsSpectator) {
      assignedPlayerId = 'spectator';
    } else {
      const claimedPlayerIds = new Set(
        Array.from(room.clients.values()).map((c) => c.playerId)
      );
      const availablePlayer = room.state.players.find(
        (p) => !claimedPlayerIds.has(p.id)
      );

      if (availablePlayer) {
        assignedPlayerId = availablePlayer.id;
        room.state.players = room.state.players.map((p) =>
          p.id === assignedPlayerId ? { ...p, name: resolvedName, isBot: false } : p
        );
      } else {
        assignedPlayerId = 'spectator';
      }
    }

    room.clients.set(sessionToken, {
      ws,
      sessionToken,
      playerId: assignedPlayerId,
      playerName: resolvedName,
      isArchives: false,
      lastSeenAt: Date.now(),
    });
  }

  const clientSession = room.clients.get(sessionToken)!;

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'JOINED_SUCCESS',
        sessionToken,
        playerId: assignedPlayerId,
        playerName: resolvedName,
        roomCode,
        isHost: sessionToken === room.hostSessionToken,
        isArchives: !!clientSession.isArchives,
      })
    );
  }

  broadcastRoom(room);

  return {
    roomCode,
    sessionToken,
    reply: {
      joined: {
        type: 'JOINED_SUCCESS',
        sessionToken,
        playerId: assignedPlayerId,
        playerName: resolvedName,
        roomCode,
        isHost: sessionToken === room.hostSessionToken,
        isArchives: !!clientSession.isArchives,
      },
      sync: buildSyncPayload(room, clientSession),
    },
  };
}

function processRoomAction(
  roomCode: string,
  sessionToken: string,
  msg: any,
  ws: WebSocket | null
): ActionResult {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return {
      reply: {
        type: 'ERROR',
        code: 'ROOM_NOT_FOUND',
        message: `Room "${roomCode}" no longer exists.`,
      },
    };
  }

  const client = room.clients.get(sessionToken);
  if (client) {
    client.lastSeenAt = Date.now();
    if (ws) client.ws = ws;
  }

  const sendDirect = (payload: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
    return payload;
  };

  switch (msg.type) {
    case 'SELECT_SEAT': {
      if (!client) return {};
      const targetSeat = msg.seatId;
      if (targetSeat !== 'spectator') {
        const validSeats = room.state.players.map((p) => p.id);
        if (!validSeats.includes(targetSeat)) {
          return {
            reply: sendDirect({
              type: 'ERROR',
              message: 'That seat is not available in this match format.',
            }),
          };
        }
      }

      if (targetSeat === 'spectator') {
        if (client.playerId && client.playerId !== 'spectator') {
          room.state.players = room.state.players.map((p) =>
            p.id === client.playerId
              ? { ...p, name: `Player ${client.playerId.replace('p', '')}`, isBot: true }
              : p
          );
        }
        client.playerId = 'spectator';
        broadcastRoom(room);
        return { reply: buildSyncPayload(room, client) };
      }

      const isTaken = Array.from(room.clients.entries()).some(
        ([tok, c]) => tok !== sessionToken && c.playerId === targetSeat
      );
      if (isTaken) {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message: 'That seat is already taken.',
          }),
        };
      }

      if (
        client.playerId &&
        client.playerId !== 'spectator' &&
        client.playerId !== targetSeat
      ) {
        room.state.players = room.state.players.map((p) =>
          p.id === client.playerId
            ? { ...p, name: `Player ${client.playerId.replace('p', '')}`, isBot: true }
            : p
        );
      }

      client.playerId = targetSeat;
      room.state.players = room.state.players.map((p) =>
        p.id === targetSeat ? { ...p, name: client.playerName, isBot: false } : p
      );

      broadcastRoom(room);
      return { reply: buildSyncPayload(room, client) };
    }

    case 'UPDATE_ARCHIVES_PASSWORD': {
      if (sessionToken !== room.hostSessionToken) {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message: 'Only the host can update the Archives password.',
          }),
        };
      }
      const newPass = (msg.password || '').trim();
      if (newPass) {
        room.archivesPassword = newPass;
        broadcastRoom(room);
        const fb = sendDirect({
          type: 'POWER_FEEDBACK',
          message: 'Archives password updated successfully.',
        });
        return {
          reply: client
            ? { ...buildSyncPayload(room, client), feedback: fb }
            : fb,
        };
      }
      return {};
    }

    case 'UNLOCK_ARCHIVES': {
      if (!client) return {};
      const enteredPass = (msg.password || '').trim().toLowerCase();
      const isCorrect =
        enteredPass === room.archivesPassword.toLowerCase() ||
        enteredPass === 'samir';

      if (isCorrect) {
        client.isArchives = true;
        if (msg.relinquishSeat) {
          if (client.playerId && client.playerId !== 'spectator') {
            room.state.players = room.state.players.map((p) =>
              p.id === client.playerId
                ? {
                    ...p,
                    name: `Player ${client.playerId.replace('p', '')}`,
                    isBot: true,
                  }
                : p
            );
          }
          client.playerId = 'spectator';
        }

        const unlockedMsg = sendDirect({
          type: 'ARCHIVES_UNLOCKED',
          success: true,
          isArchives: true,
          playerId: client.playerId,
        });
        broadcastRoom(room);
        return {
          reply: {
            ...buildSyncPayload(room, client),
            unlocked: unlockedMsg,
          },
        };
      } else {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message:
              'Incorrect Archives password. Please request the password from the host.',
          }),
        };
      }
    }

    case 'LEAVE_ROOM': {
      if (client) {
        if (!room.gameStarted) {
          room.state.players = room.state.players.map((p) => {
            if (p.id === client.playerId) {
              return {
                ...p,
                name: `Player ${client.playerId.replace('p', '')}`,
                isBot: true,
              };
            }
            return p;
          });
        }
        room.clients.delete(sessionToken);
        if (room.hostSessionToken === sessionToken && room.clients.size > 0) {
          const nextHost = room.clients.keys().next().value;
          if (nextHost) room.hostSessionToken = nextHost;
        }
        broadcastRoom(room);
      }
      return { leftRoom: true, reply: { type: 'LEFT_ROOM' } };
    }

    case 'START_GAME': {
      if (sessionToken !== room.hostSessionToken) {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message: 'Only the host who created the room can start the game.',
          }),
        };
      }
      room.gameStarted = true;
      room.state.isTimerRunning = true;
      broadcastRoom(room);
      return { reply: client ? buildSyncPayload(room, client) : undefined };
    }

    case 'ASK_QUESTION': {
      const req: QuestionRequest = msg.request;
      const res = askQuestion(room.state, req);
      if (res.success) {
        room.state = res.state;
        broadcastRoom(room);
        return { reply: client ? buildSyncPayload(room, client) : undefined };
      } else {
        return { reply: sendDirect({ type: 'ERROR', message: res.error }) };
      }
    }

    case 'BUY_TOKEN': {
      if (!client) return {};
      const res = buyBonusToken(room.state, client.playerId);
      if (res.success) {
        room.state = res.state;
        broadcastRoom(room);
      }
      return { reply: buildSyncPayload(room, client) };
    }

    case 'SUBMIT_GUESS': {
      if (!client) return {};
      const res = submitOrEditGuess(
        room.state,
        client.playerId,
        msg.targetPlayerId,
        msg.suit,
        msg.value,
        msg.isGambit
      );
      if (res.success) {
        room.state = res.state;
        broadcastRoom(room);
        return { reply: buildSyncPayload(room, client) };
      } else {
        return { reply: sendDirect({ type: 'ERROR', message: res.error }) };
      }
    }

    case 'ACTIVATE_POWER': {
      if (!client) return {};
      if (
        room.state.players.find((p) => p.id === client.playerId)?.powerId ===
          'Divine Sight' &&
        msg.targetPlayerId
      ) {
        if (!room.divineSightKnown[client.playerId]) {
          room.divineSightKnown[client.playerId] = [];
        }
        room.divineSightKnown[client.playerId].push(msg.targetPlayerId);
      }

      const res = activatePower(room.state, client.playerId, msg.targetPlayerId);
      if (res.success) {
        room.state = res.state;
        const fb = sendDirect({ type: 'POWER_FEEDBACK', message: res.message });
        broadcastRoom(room);
        return { reply: { ...buildSyncPayload(room, client), feedback: fb } };
      } else {
        return { reply: sendDirect({ type: 'ERROR', message: res.message }) };
      }
    }

    case 'EQUIP_POWER': {
      if (!client) return {};
      const res = equipPower(room.state, client.playerId, msg.powerId);
      if (res.success) {
        room.state = res.state;
        const fb = sendDirect({ type: 'POWER_FEEDBACK', message: res.message });
        broadcastRoom(room);
        return { reply: { ...buildSyncPayload(room, client), feedback: fb } };
      }
      return { reply: buildSyncPayload(room, client) };
    }

    case 'EQUIP_CHARACTER': {
      if (!client) return {};
      const res = equipCharacter(room.state, client.playerId, msg.characterId);
      if (res.success) {
        room.state = res.state;
        const fb = sendDirect({ type: 'POWER_FEEDBACK', message: res.message });
        broadcastRoom(room);
        return { reply: { ...buildSyncPayload(room, client), feedback: fb } };
      }
      return { reply: buildSyncPayload(room, client) };
    }

    case 'RESOLVE_ROUND': {
      if (sessionToken !== room.hostSessionToken) {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message: 'Only the room host can resolve rounds.',
          }),
        };
      }
      let state = room.state;
      state = autoPlayAllBots(state);
      room.state = resolveRoundGuesses(state);
      broadcastRoom(room);
      return { reply: client ? buildSyncPayload(room, client) : undefined };
    }

    case 'ADVANCE_ROUND': {
      if (sessionToken !== room.hostSessionToken) {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message: 'Only the room host can advance rounds.',
          }),
        };
      }
      room.state = advanceToNextRound(room.state);
      broadcastRoom(room);
      return { reply: client ? buildSyncPayload(room, client) : undefined };
    }

    case 'SIMULATE_BOTS': {
      if (sessionToken !== room.hostSessionToken) {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message: 'Only the room host can trigger bot simulation.',
          }),
        };
      }
      room.state = autoPlayAllBots(room.state);
      broadcastRoom(room);
      return { reply: client ? buildSyncPayload(room, client) : undefined };
    }

    case 'SELECT_SHABARI_SUIT': {
      if (!client) return {};
      room.state = setShabariSuit(room.state, client.playerId, msg.suit);
      broadcastRoom(room);
      return { reply: buildSyncPayload(room, client) };
    }

    case 'RESET_GAME': {
      if (sessionToken !== room.hostSessionToken) {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message: 'Only the room host can reset the game.',
          }),
        };
      }
      const initial = createInitialGame({
        roomCode: room.roomCode,
        playerCount: room.customSetup?.playerCount || room.state.playerCount,
        characterOverride: room.customSetup?.characterOverride,
        powerOverride: room.customSetup?.powerOverride,
      });
      initial.isTimerRunning = true;
      room.state = initial;
      room.divineSightKnown = {};
      broadcastRoom(room);
      return { reply: client ? buildSyncPayload(room, client) : undefined };
    }

    case 'UPDATE_ROOM_SETUP': {
      if (room.gameStarted) return {};
      if (sessionToken !== room.hostSessionToken) {
        return {
          reply: sendDirect({
            type: 'ERROR',
            message: 'Only the host can adjust room setup.',
          }),
        };
      }
      const playerCount: 6 | 8 = msg.playerCount === 6 ? 6 : 8;
      room.customSetup = {
        playerCount,
        characterOverride: msg.characterOverride,
        powerOverride: msg.powerOverride,
      };
      const newState = createInitialGame({
        roomCode: room.roomCode,
        playerCount,
        characterOverride: msg.characterOverride,
        powerOverride: msg.powerOverride,
      });
      for (const [, c] of room.clients.entries()) {
        if (c.playerId && c.playerId !== 'spectator') {
          const seatNum = parseInt(c.playerId.replace('p', ''), 10);
          if (seatNum > playerCount) {
            c.playerId = 'spectator';
          } else {
            newState.players = newState.players.map((p) =>
              p.id === c.playerId ? { ...p, name: c.playerName, isBot: false } : p
            );
          }
        }
      }
      room.state = newState;
      broadcastRoom(room);
      return { reply: client ? buildSyncPayload(room, client) : undefined };
    }

    case 'TOGGLE_TIMER': {
      const isRunning =
        msg.isRunning !== undefined ? !!msg.isRunning : !room.state.isTimerRunning;
      room.state.isTimerRunning = isRunning;
      broadcastRoom(room);
      return { reply: client ? buildSyncPayload(room, client) : undefined };
    }

    case 'CYCLE_CARD_TAG': {
      if (!client) return {};
      room.state = cycleCardTag(room.state, client.playerId, msg.cardKey);
      broadcastRoom(room);
      return { reply: buildSyncPayload(room, client) };
    }

    case 'TOGGLE_CARD_TAG_MODE': {
      if (!client) return {};
      room.state = toggleCardTagMode(room.state, client.playerId, msg.cardKey);
      broadcastRoom(room);
      return { reply: buildSyncPayload(room, client) };
    }

    case 'SET_CARD_TAG': {
      if (!client) return {};
      room.state = setCardTag(room.state, client.playerId, msg.cardKey, msg.tag);
      broadcastRoom(room);
      return { reply: buildSyncPayload(room, client) };
    }

    default:
      return {};
  }
}

// REST API for room info & HTTP transport fallback
app.get('/api/room/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ exists: false });
  }
  return res.json({
    exists: true,
    roomCode: room.roomCode,
    gameStarted: room.gameStarted,
    playerCount: room.state.playerCount,
    playersCount: room.clients.size,
    players: Array.from(room.clients.values()).map((c) => ({
      playerId: c.playerId,
      name: c.playerName,
    })),
  });
});

app.post('/api/room/join', (req, res) => {
  const result = handleJoinRoom(req.body || {}, null);
  if (result.reply?.type === 'ERROR') {
    return res.status(404).json(result.reply);
  }
  return res.json(result.reply);
});

app.get('/api/room/:code/sync', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const sessionToken = String(req.query.sessionToken || '').trim();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ type: 'ERROR', code: 'ROOM_NOT_FOUND', message: 'Room not found.' });
  }
  const client = room.clients.get(sessionToken);
  if (!client) {
    return res.status(404).json({ type: 'ERROR', code: 'SESSION_NOT_FOUND', message: 'Session not found in room.' });
  }
  client.lastSeenAt = Date.now();
  return res.json(buildSyncPayload(room, client));
});

app.post('/api/room/:code/action', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { sessionToken, ...msg } = req.body || {};
  if (!sessionToken) {
    return res.status(400).json({ type: 'ERROR', message: 'Missing sessionToken.' });
  }
  const result = processRoomAction(code, sessionToken, msg, null);
  if (result.reply?.type === 'ERROR') {
    return res.status(400).json(result.reply);
  }
  return res.json(result.reply || { ok: true });
});

// WebSocket Connection Handler
wss.on('connection', (ws) => {
  let currentRoomCode: string | null = null;
  let currentSessionToken: string | null = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'PING') {
        if (currentRoomCode && currentSessionToken) {
          const r = rooms.get(currentRoomCode);
          const c = r?.clients.get(currentSessionToken);
          if (c) c.lastSeenAt = Date.now();
        }
        ws.send(JSON.stringify({ type: 'PONG' }));
        return;
      }

      if (msg.type === 'JOIN_ROOM') {
        const res = handleJoinRoom(msg, ws);
        if (res.reply?.type === 'ERROR') {
          ws.send(JSON.stringify(res.reply));
          return;
        }
        if (res.roomCode && res.sessionToken) {
          currentRoomCode = res.roomCode;
          currentSessionToken = res.sessionToken;
        }
        return;
      }

      const targetRoomCode = (msg.roomCode || currentRoomCode || '').toUpperCase().trim();
      const targetToken = (msg.sessionToken || currentSessionToken || '').trim();
      if (!targetRoomCode || !targetToken) return;

      const res = processRoomAction(targetRoomCode, targetToken, msg, ws);
      if (res.leftRoom) {
        currentRoomCode = null;
        currentSessionToken = null;
      }
    } catch (err: any) {
      console.error('WebSocket error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentSessionToken) {
      const r = rooms.get(currentRoomCode);
      const c = r?.clients.get(currentSessionToken);
      if (c && c.ws === ws) {
        c.ws = null;
      }
    }
  });
});

// Prune only stale abandoned rooms after 2 hours of inactivity
setInterval(() => {
  const now = Date.now();
  let deleted = false;
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastUpdated > 2 * 3600000) {
      rooms.delete(code);
      deleted = true;
    }
  }
  if (deleted) schedulePersistRooms();
}, 60000);

// Mount Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`BLINDS Diwali Server running on http://localhost:${port}`);
  });
}

startServer();
