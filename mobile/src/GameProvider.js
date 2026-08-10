import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS, saveSession, loadSession, clearSession as clearStoredSession } from './utils';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';

const GameContext = createContext(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

export function GameProvider({ children }) {
  const socketRef = useRef(null);

  const [screen, setScreen] = useState('landing');
  const [role, setRole] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [isEliminated, setIsEliminated] = useState(false);
  const [elimReason, setElimReason] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [landingError, setLandingError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [firstWordError, setFirstWordError] = useState('');
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);
  const [pendingKickPlayer, setPendingKickPlayer] = useState(null);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [showPendingNotice, setShowPendingNotice] = useState(false);
  const [connected, setConnected] = useState(false);

  const latest = useRef({
    role: null, playerId: null, isEliminated: false, roomState: null,
  }).current;

  function updateRole(v) { latest.role = v; setRole(v); }
  function updatePlayerId(v) { latest.playerId = v; setPlayerId(v); }
  function updateIsEliminated(v) { latest.isEliminated = v; setIsEliminated(v); }
  function updateRoomState(v) { latest.roomState = v; setRoomState(v); }

  useEffect(() => {
    AsyncStorage.getItem(KEYS.SOUND).then(val => {
      if (val === 'off') setSoundEnabled(false);
    });
  }, []);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      tryReconnect(socket);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('roomState', onRoomState);
    socket.on('playerEliminated', onPlayerEliminated);
    socket.on('gameEnded', onGameEnded);
    socket.on('gameResumed', () => {
      if (latest.roomState) onRoomState(latest.roomState);
    });
    socket.on('yourTurn', onYourTurn);
    socket.on('pendingApproval', onPendingApproval);
    socket.on('kickedFromRoom', onKickedFromRoom);
    socket.on('roomClosed', onRoomClosed);

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (screen === 'host-game' || screen === 'player-game') {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake();
    }
  }, [screen]);

  function routeScreen(rl, st, elim) {
    if (rl === 'host') {
      if (st === 'ended') return 'winner';
      if (st === 'lobby') return 'host-lobby';
      return 'host-game';
    }
    if (rl === 'player') {
      if (st === 'ended') return 'winner';
      if (elim && st !== 'lobby') return 'eliminated';
      if (st === 'lobby') return 'player-lobby';
      return 'player-game';
    }
    return 'landing';
  }

  function onRoomState(state) {
    if (!state) return;
    if (state.game) state.game._clientReceivedAt = Date.now();

    let elim = latest.isEliminated;
    let reason = null;
    const rl = latest.role;
    const pid = latest.playerId;
    const { status } = state;

    if (rl === 'player' && elim) {
      if (status === 'lobby' || status === 'ended') {
        elim = false; reason = null;
      } else if (status === 'playing') {
        const me = state.players.find(p => p.id === pid);
        if (me?.alive) { elim = false; reason = null; }
      }
    }

    updateIsEliminated(elim);
    if (reason !== undefined) setElimReason(reason);
    updateRoomState(state);

    const game = state.game;
    if (game) {
      const isPending = !!game.pendingWord;
      const isMeTurn = game.currentTurnPlayerId === pid;
      setShowPendingNotice(isPending && isMeTurn && rl === 'player');
      if (!isPending || !isMeTurn) {
        setInputDisabled(false);
      }
    }

    setScreen(routeScreen(rl, status, elim));
  }

  function onPlayerEliminated(data) {
    const isMe = data.playerId === latest.playerId;
    if (isMe) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      updateIsEliminated(true);
      setElimReason(data.reason);
      setScreen('eliminated');
    }
  }

  function onGameEnded(data) {
    const iWon = data.winnerId && data.winnerId === latest.playerId;
    if (iWon || latest.role === 'host') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setInputDisabled(false);
    setShowPendingNotice(false);
  }

  function onYourTurn(data) {
    if (data.playerId === latest.playerId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setInputDisabled(false);
      setShowPendingNotice(false);
    }
  }

  function onPendingApproval() {
    if (latest.role === 'host') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  function onKickedFromRoom(data) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    resetAll();
    Alert.alert('', data?.reason || 'طردك الحكم من الغرفة');
  }

  function onRoomClosed() {
    if (latest.role !== 'player') return;
    resetAll();
    Alert.alert('', 'أنهى الهوست الغرفة');
  }

  async function tryReconnect(socket) {
    try {
      const session = await loadSession();
      const savedRole = session[KEYS.ROLE];
      const savedRoom = session[KEYS.ROOM];
      if (!savedRole || !savedRoom) return;

      if (savedRole === 'host') {
        const hToken = session[KEYS.HTOKEN];
        if (!hToken) { await clearStoredSession(); return; }
        socket.emit('reconnectHost', { code: savedRoom, hostToken: hToken }, res => {
          if (!res.success) { clearStoredSession(); return; }
          updateRole('host');
          setRoomCode(savedRoom);
          onRoomState(res.roomState);
        });
      } else if (savedRole === 'player') {
        const pid = session[KEYS.PID];
        const tok = session[KEYS.PTOKEN];
        const name = session[KEYS.NAME];
        if (!pid || !tok) { await clearStoredSession(); return; }
        socket.emit('joinRoom', { code: savedRoom, name, playerId: pid, token: tok }, res => {
          if (!res.success) { clearStoredSession(); return; }
          updateRole('player');
          updatePlayerId(res.playerId);
          setPlayerName(res.playerName || name);
          setRoomCode(savedRoom);
          const me = res.roomState?.players?.find(p => p.id === res.playerId);
          if (me?.eliminated) {
            updateIsEliminated(true);
            setElimReason(me.eliminationReason);
          }
          onRoomState(res.roomState);
        });
      }
    } catch (_) {}
  }

  function resetAll() {
    clearStoredSession();
    updateRole(null);
    updatePlayerId(null);
    setPlayerName(null);
    setRoomCode(null);
    updateRoomState(null);
    updateIsEliminated(false);
    setElimReason(null);
    setScreen('landing');
    setLandingError('');
    setSubmitError('');
    setFirstWordError('');
    setShowEndGameModal(false);
    setShowKickModal(false);
    setPendingKickPlayer(null);
    setInputDisabled(false);
    setShowPendingNotice(false);
  }

  const createRoom = useCallback(() => {
    socketRef.current?.emit('createRoom', res => {
      if (!res.success) return;
      updateRole('host');
      setRoomCode(res.code);
      saveSession({
        [KEYS.ROLE]: 'host',
        [KEYS.ROOM]: res.code,
        [KEYS.HTOKEN]: res.hostToken,
      });
      setScreen('host-lobby');
      setRoomState({
        code: res.code, status: 'lobby', players: [],
        timerMode: 'dynamic', lastWinner: null, game: null,
      });
    });
  }, []);

  const joinRoom = useCallback((code, name) => {
    setLandingError('');
    const c = (code || '').trim().toUpperCase();
    const n = (name || '').trim();
    if (!c || c.length !== 4) { setLandingError('أدخل رمز الغرفة (4 أحرف)'); return; }
    if (!n) { setLandingError('أدخل اسمك'); return; }

    socketRef.current?.emit('joinRoom', { code: c, name: n }, res => {
      if (!res.success) { setLandingError(res.reason || 'خطأ في الانضمام'); return; }
      updateRole('player');
      updatePlayerId(res.playerId);
      setPlayerName(res.playerName || n);
      setRoomCode(res.roomState?.code || c);
      saveSession({
        [KEYS.ROLE]: 'player',
        [KEYS.ROOM]: res.roomState?.code || c,
        [KEYS.PID]: res.playerId,
        [KEYS.PTOKEN]: res.token,
        [KEYS.NAME]: res.playerName || n,
      });
      onRoomState(res.roomState);
    });
  }, []);

  const startGame = useCallback((firstWord) => {
    const w = (firstWord || '').trim();
    if (!w) { setFirstWordError('اكتب الكلمة الأولى قبل البدء'); return; }
    if (/\s/.test(w)) { setFirstWordError('كلمة واحدة فقط بدون مسافات'); return; }
    setFirstWordError('');
    socketRef.current?.emit('startGame', { firstWord: w }, res => {
      if (res && !res.success) setFirstWordError(res.reason || 'خطأ في بدء اللعبة');
    });
  }, []);

  const submitWord = useCallback((word, clearInput) => {
    const w = (word || '').trim();
    if (!w) { setSubmitError('الكلمة فارغة'); return; }
    if (/\s/.test(w)) { setSubmitError('كلمة واحدة فقط بدون مسافات'); return; }
    setSubmitError('');
    setInputDisabled(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    socketRef.current?.emit('submitWord', { word: w }, res => {
      if (res && !res.success && !res.pending) {
        clearInput?.();
        setInputDisabled(false);
      } else if (res?.pending) {
        clearInput?.();
        setShowPendingNotice(true);
      }
    });
  }, []);

  const judgeDecision = useCallback((accept) => {
    Haptics.impactAsync(accept
      ? Haptics.ImpactFeedbackStyle.Light
      : Haptics.ImpactFeedbackStyle.Heavy);
    socketRef.current?.emit('judgeDecision', { accept });
  }, []);

  const hostDropPlayer = useCallback((pid) => {
    socketRef.current?.emit('hostDropPlayer', { playerId: pid });
  }, []);

  const hostKickPlayer = useCallback((pid) => {
    socketRef.current?.emit('hostKickPlayer', { playerId: pid });
    setPendingKickPlayer(null);
    setShowKickModal(false);
  }, []);

  const setTimerMode = useCallback((mode) => {
    socketRef.current?.emit('setTimerMode', { mode });
  }, []);

  const adjustTimer = useCallback((delta) => {
    socketRef.current?.emit('hostAdjustTimer', { delta });
  }, []);

  const pauseTimer = useCallback(() => {
    socketRef.current?.emit('hostPauseTimer', res => {
      if (res && !res.success && res.reason) Alert.alert('', res.reason);
    });
  }, []);

  const resumeTimer = useCallback(() => {
    socketRef.current?.emit('hostResumeTimer');
  }, []);

  const endGame = useCallback((winnerId) => {
    socketRef.current?.emit('hostEndGame', { winnerId }, () => {
      setShowEndGameModal(false);
    });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leaveRoom', {}, () => resetAll());
  }, []);

  const closeRoom = useCallback(() => {
    socketRef.current?.emit('closeRoom', {}, () => resetAll());
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      AsyncStorage.setItem(KEYS.SOUND, next ? 'on' : 'off');
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    if (latest.role === 'host') {
      socketRef.current?.emit('closeRoom', {}, () => {});
    } else if (latest.role === 'player') {
      socketRef.current?.emit('leaveRoom', {}, () => {});
    }
    resetAll();
  }, []);

  const deleteAllData = useCallback(async () => {
    if (latest.role === 'host') {
      socketRef.current?.emit('closeRoom', {}, () => {});
    } else if (latest.role === 'player') {
      socketRef.current?.emit('leaveRoom', {}, () => {});
    }
    try { await AsyncStorage.clear(); } catch (_) {}
    setSoundEnabled(true);
    resetAll();
  }, []);

  const value = {
    screen, role, roomCode, playerId, playerName,
    roomState, isEliminated, elimReason,
    soundEnabled, landingError, submitError, firstWordError,
    showEndGameModal, showKickModal, pendingKickPlayer,
    inputDisabled, showPendingNotice, connected,

    createRoom, joinRoom, startGame, submitWord,
    judgeDecision, hostDropPlayer, hostKickPlayer,
    setTimerMode, adjustTimer, pauseTimer, resumeTimer,
    endGame, leaveRoom, closeRoom, toggleSound, resetAll,
    logout, deleteAllData,
    setShowEndGameModal, setShowKickModal, setPendingKickPlayer,
    setLandingError, setSubmitError, setFirstWordError,
    setScreen,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
