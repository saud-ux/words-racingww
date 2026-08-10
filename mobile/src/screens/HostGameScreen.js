import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { colors, radius, shared } from '../theme';
import { useGame } from '../GameProvider';
import WordDisplay from '../components/WordDisplay';
import TimerRing from '../components/TimerRing';
import PlayerList from '../components/PlayerList';

export default function HostGameScreen() {
  const {
    roomState, roomCode,
    judgeDecision, hostDropPlayer, hostKickPlayer,
    adjustTimer, pauseTimer, resumeTimer,
    showEndGameModal, setShowEndGameModal, endGame,
    closeRoom, setScreen,
  } = useGame();

  const game = roomState?.game;
  const status = roomState?.status;
  const players = roomState?.players || [];
  const isPaused = status === 'paused';
  const isManualPause = isPaused && game?.pausedReason === 'manual';
  const isPlayerPause = isPaused && game?.pausedReason === 'player';
  const hasPending = !!game?.pendingWord;

  const events = game?.events || [];
  const usedWords = game?.usedWords || [];

  const handleKick = (player) => {
    Alert.alert(
      'طرد اللاعب؟',
      `هل تريد طرد "${player.name}" من الغرفة؟`,
      [
        { text: 'رجوع', style: 'cancel' },
        { text: 'نعم، اطرده', style: 'destructive', onPress: () => hostKickPlayer(player.id) },
      ]
    );
  };

  const handleEndGame = () => {
    setShowEndGameModal(true);
  };

  const handleExitRoom = () => {
    Alert.alert(
      'إغلاق الغرفة',
      'سيتم إنهاء الغرفة لجميع اللاعبين',
      [
        { text: 'رجوع', style: 'cancel' },
        { text: 'إغلاق', style: 'destructive', onPress: closeRoom },
      ]
    );
  };

  if (!game) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <TouchableOpacity
            style={[shared.btn, shared.btnPrimary, shared.btnLg]}
            onPress={() => setScreen('host-lobby')}
          >
            <Text style={shared.btnText}>بدء لعبة جديدة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const alivePlayers = players.filter(p => !p.eliminated);

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <View style={shared.roleBadge}>
          <Text style={shared.roleBadgeText}>الحكم</Text>
        </View>
        <Text style={styles.topCode}>غرفة: <Text style={styles.topCodeBold}>{roomCode}</Text></Text>
        <Text style={styles.tierBadge}>{game.tierLabel || '—'}</Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <WordDisplay
          currentWord={game.currentWord}
          requiredLetter={game.requiredLetter}
        />

        <TimerRing game={game} size={120} />

        {/* Timer controls */}
        <View style={styles.actionRow}>
          <Text style={styles.actionLabel}>المؤقت:</Text>
          <TouchableOpacity
            style={[shared.btn, shared.btnSecondary, shared.btnSm]}
            onPress={() => adjustTimer(-5)}
            disabled={hasPending || isPaused}
          >
            <Text style={shared.btnTextSecondary}>−5ث</Text>
          </TouchableOpacity>

          {isManualPause ? (
            <TouchableOpacity
              style={[shared.btn, shared.btnPrimary, shared.btnSm]}
              onPress={resumeTimer}
              disabled={hasPending}
            >
              <Text style={shared.btnText}>▶</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[shared.btn, shared.btnSecondary, shared.btnSm]}
              onPress={pauseTimer}
              disabled={hasPending || isPaused}
            >
              <Text style={shared.btnTextSecondary}>⏸</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[shared.btn, shared.btnSecondary, shared.btnSm]}
            onPress={() => adjustTimer(5)}
            disabled={hasPending || isPaused}
          >
            <Text style={shared.btnTextSecondary}>+5ث</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[shared.btn, shared.btnDanger, shared.btnSm]}
            onPress={handleEndGame}
            disabled={hasPending}
          >
            <Text style={shared.btnTextDanger}>إنهاء</Text>
          </TouchableOpacity>
        </View>

        {/* Manual pause banner */}
        {isManualPause && (
          <View style={styles.manualPauseBanner}>
            <Text style={styles.manualPauseText}>⏸ المؤقت موقوف — اضغط ▶ للاستئناف</Text>
          </View>
        )}

        {/* Approval panel */}
        {hasPending && (
          <View style={styles.approvalPanel}>
            <Text style={styles.approvalHeader}>
              كلمة من <Text style={styles.approvalName}>{game.pendingPlayerName || ''}</Text>
            </Text>
            <Text style={styles.approvalWord}>{game.pendingWord}</Text>
            <View style={styles.approvalBtns}>
              <TouchableOpacity
                style={[shared.btn, styles.acceptBtn]}
                onPress={() => judgeDecision(true)}
              >
                <Text style={styles.acceptText}>قبول</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[shared.btn, styles.rejectBtn]}
                onPress={() => judgeDecision(false)}
              >
                <Text style={styles.rejectText}>رفض</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Player disconnect pause */}
        {isPlayerPause && (
          <View style={styles.pausePanel}>
            <Text style={styles.pauseIcon}>📵</Text>
            <Text style={styles.pauseMsg}>
              انقطع اتصال اللاعب: {game.pausedForPlayerName || ''}
            </Text>
            <View style={styles.pauseBtns}>
              <TouchableOpacity style={[shared.btn, shared.btnSecondary, shared.btnSm]}>
                <Text style={shared.btnTextSecondary}>انتظار</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[shared.btn, shared.btnDanger, shared.btnSm]}
                onPress={() => hostDropPlayer(game.pausedForPlayerId)}
              >
                <Text style={shared.btnTextDanger}>إكمال بدونه</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Players */}
        <View style={[shared.card, styles.section]}>
          <Text style={shared.sectionTitle}>اللاعبون</Text>
          <PlayerList
            players={players}
            currentTurnId={game.currentTurnPlayerId}
            canKick
            onKick={handleKick}
          />
        </View>

        {/* Events */}
        <View style={[shared.card, styles.section]}>
          <View style={styles.sectionHeader}>
            <Text style={shared.sectionTitle}>ماذا يحدث</Text>
            <View style={shared.countBadge}>
              <Text style={shared.countBadgeText}>{events.length}</Text>
            </View>
          </View>
          {events.length === 0 ? (
            <Text style={styles.emptyListText}>في انتظار الأحداث...</Text>
          ) : (
            [...events].reverse().map((ev, i) => (
              <EventItem key={ev.id || i} event={ev} />
            ))
          )}
        </View>

        {/* Used words */}
        <View style={[shared.card, styles.section]}>
          <View style={styles.sectionHeader}>
            <Text style={shared.sectionTitle}>الكلمات</Text>
            <View style={shared.countBadge}>
              <Text style={shared.countBadgeText}>{usedWords.length}</Text>
            </View>
          </View>
          {[...usedWords].reverse().map((entry, ri) => {
            const idx = usedWords.length - ri;
            const w = typeof entry === 'string' ? entry : entry.word;
            const pn = typeof entry === 'string' ? '' : entry.playerName;
            return (
              <View key={ri} style={styles.wordItem}>
                <Text style={styles.wordIndex}>{idx}</Text>
                <Text style={styles.wordText}>{w}</Text>
                {!!pn && <Text style={styles.wordAuthor}>{pn}</Text>}
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.exitGameBtn} onPress={handleExitRoom}>
          <Text style={styles.exitGameBtnText}>إغلاق الغرفة</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* End Game Modal */}
      <Modal visible={showEndGameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[shared.card, styles.modalBox]}>
            <Text style={styles.modalIcon}>⏹</Text>
            <Text style={styles.modalTitle}>إنهاء اللعبة</Text>
            <Text style={styles.modalHint}>اختر الفائز أو أنهِ بدون فائز:</Text>

            {alivePlayers.length === 0 ? (
              <Text style={styles.emptyListText}>لا يوجد لاعبون أحياء</Text>
            ) : (
              alivePlayers.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.winnerPick}
                  onPress={() => {
                    Alert.alert('', `إنهاء اللعبة وإعلان ${p.name} فائزاً؟`, [
                      { text: 'رجوع', style: 'cancel' },
                      { text: 'نعم', onPress: () => endGame(p.id) },
                    ]);
                  }}
                >
                  <View style={[styles.pickAvatar, { backgroundColor: colors.accentDim }]}>
                    <Text style={styles.pickAvatarText}>{p.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.pickName}>{p.name}</Text>
                  <Text style={styles.pickLabel}>اختر فائزاً</Text>
                </TouchableOpacity>
              ))
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[shared.btn, shared.btnDanger]}
                onPress={() => {
                  Alert.alert('', 'إنهاء اللعبة بدون فائز؟', [
                    { text: 'رجوع', style: 'cancel' },
                    { text: 'إنهاء', style: 'destructive', onPress: () => endGame(null) },
                  ]);
                }}
              >
                <Text style={shared.btnTextDanger}>إنهاء بدون فائز</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[shared.btn, shared.btnSecondary]}
                onPress={() => setShowEndGameModal(false)}
              >
                <Text style={shared.btnTextSecondary}>رجوع</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EventItem({ event }) {
  const ev = event;
  const name = ev.playerName || '';

  const configs = {
    gameStarted:  { icon: '🎮', color: colors.accent },
    wordAccepted: { icon: '✓', color: colors.success },
    wordRejected: { icon: '✗', color: colors.danger },
    wrongLetter:  { icon: '⚠', color: colors.danger },
    repeatedWord: { icon: '↻', color: colors.danger },
    timeout:      { icon: '⏱', color: colors.danger },
    dropped:      { icon: '👋', color: colors.danger },
    kicked:       { icon: '⛔', color: colors.danger },
  };

  const cfg = configs[ev.type] || { icon: '•', color: colors.textMuted };
  let detail = '';
  if (ev.type === 'gameStarted') detail = `بدأت — ${ev.count} لاعبين`;
  else if (ev.type === 'wordAccepted') detail = `${name}: ${ev.word}`;
  else if (ev.type === 'wordRejected') detail = `${name}: ${ev.word} — رُفضت`;
  else if (ev.type === 'wrongLetter') detail = `${name}: ${ev.word} — حرف خاطئ`;
  else if (ev.type === 'repeatedWord') detail = `${name}: ${ev.word} — مكررة`;
  else if (ev.type === 'timeout') detail = `${name} — انتهى الوقت`;
  else if (ev.type === 'dropped') detail = `${name} — انسحب`;
  else if (ev.type === 'kicked') detail = `${name} — طُرد`;
  else detail = ev.type;

  return (
    <View style={evStyles.row}>
      <Text style={[evStyles.icon, { color: cfg.color }]}>{cfg.icon}</Text>
      <Text style={evStyles.text} numberOfLines={1}>{detail}</Text>
    </View>
  );
}

const evStyles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 8,
  },
  icon: {
    fontSize: 14,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  text: {
    flex: 1,
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  topbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  topCode: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
  },
  topCodeBold: {
    fontFamily: 'Tajawal_700Bold',
    color: colors.text,
  },
  tierBadge: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 12,
    color: colors.warm,
    backgroundColor: colors.warm + '15',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  actionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  actionLabel: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
  },
  manualPauseBanner: {
    backgroundColor: colors.warm + '15',
    borderRadius: radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warm + '33',
  },
  manualPauseText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.warm,
    textAlign: 'center',
  },
  approvalPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.warm,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  approvalHeader: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  approvalName: {
    fontFamily: 'Tajawal_700Bold',
    color: colors.warm,
  },
  approvalWord: {
    fontFamily: 'Tajawal_900Black',
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
  },
  approvalBtns: {
    flexDirection: 'row-reverse',
    gap: 12,
    width: '100%',
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.success,
  },
  acceptText: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: colors.danger,
  },
  rejectText: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  pausePanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  pauseIcon: { fontSize: 28 },
  pauseMsg: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  pauseBtns: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  section: {
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyListText: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    paddingVertical: 8,
  },
  wordItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  wordIndex: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 12,
    color: colors.textDim,
    width: 24,
    textAlign: 'center',
  },
  wordText: {
    flex: 1,
    fontFamily: 'Tajawal_700Bold',
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  wordAuthor: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'right',
  },
  exitGameBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  exitGameBtnText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    alignItems: 'center',
    gap: 10,
  },
  modalIcon: { fontSize: 32 },
  modalTitle: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 20,
    color: colors.text,
  },
  modalHint: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  winnerPick: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    padding: 12,
    width: '100%',
    marginVertical: 3,
  },
  pickAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  pickAvatarText: {
    fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, color: '#fff',
  },
  pickName: {
    flex: 1,
    fontFamily: 'Tajawal_700Bold', fontSize: 15, color: colors.text,
    textAlign: 'right', writingDirection: 'rtl',
  },
  pickLabel: {
    fontFamily: 'Tajawal_500Medium', fontSize: 12, color: colors.success,
  },
  modalBtns: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
});
