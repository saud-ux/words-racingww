import AsyncStorage from '@react-native-async-storage/async-storage';

export function stripDiacritics(s) {
  return s.replace(/[ً-ْٰـ]/g, '');
}

export function unifyHamza(ch) {
  return 'أإآٱ'.includes(ch) ? 'ا' : ch;
}

export function requiredNextLetter(word) {
  const w = stripDiacritics(word).trim();
  let last = w[w.length - 1];
  if (last === 'ة' || last === 'ى') last = w[w.length - 2];
  return last ? unifyHamza(last) : '';
}

export const KEYS = {
  ROLE: 'wr_role',
  ROOM: 'wr_room',
  PID: 'wr_pid',
  PTOKEN: 'wr_ptoken',
  HTOKEN: 'wr_htoken',
  NAME: 'wr_name',
  SOUND: 'wr_sound',
};

export async function saveSession(data) {
  const pairs = Object.entries(data).filter(([, v]) => v != null);
  await AsyncStorage.multiSet(pairs.map(([k, v]) => [k, String(v)]));
}

export async function loadSession() {
  const keys = Object.values(KEYS);
  const pairs = await AsyncStorage.multiGet(keys);
  const obj = {};
  pairs.forEach(([k, v]) => { obj[k] = v; });
  return obj;
}

export async function clearSession() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export function computeRemaining(game) {
  if (!game) return 0;
  if (game.serverTimeRemaining !== undefined && game.serverTimeRemaining !== null) {
    if (game.pausedReason) return game.serverTimeRemaining;
    if (game.pendingWord) return game.serverTimeRemaining;
    const clientReceivedAt = game._clientReceivedAt || Date.now();
    const elapsed = (Date.now() - clientReceivedAt) / 1000;
    return Math.max(0, game.serverTimeRemaining - elapsed);
  }
  if (game.pausedReason) return game.frozenTimeRemaining ?? game.timerSeconds;
  if (game.pendingWord) {
    if (game.timerStoppedAt && game.timerStartedAt)
      return Math.max(0, game.timerSeconds - (game.timerStoppedAt - game.timerStartedAt) / 1000);
    return game.timerSeconds;
  }
  if (!game.timerStartedAt) return game.timerSeconds;
  return Math.max(0, game.timerSeconds - (Date.now() - game.timerStartedAt) / 1000);
}

export function timerColor(rem) {
  if (rem <= 2) return '#C4702A';
  if (rem <= 4) return '#C4A060';
  if (rem <= 7) return '#978F66';
  return '#7a9a6a';
}
