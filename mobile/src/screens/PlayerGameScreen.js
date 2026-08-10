import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, radius, shared } from '../theme';
import { useGame } from '../GameProvider';
import WordDisplay from '../components/WordDisplay';
import TimerRing from '../components/TimerRing';

export default function PlayerGameScreen() {
  const {
    roomState, playerId, submitWord, leaveRoom,
    submitError, inputDisabled, showPendingNotice,
  } = useGame();

  const [wordInput, setWordInput] = useState('');
  const inputRef = useRef(null);

  const game = roomState?.game;
  const players = roomState?.players || [];
  const isMeTurn = game?.currentTurnPlayerId === playerId;
  const isPending = !!game?.pendingWord;
  const isPaused = !!game?.pausedReason;
  const canSubmit = isMeTurn && !isPending && !isPaused && roomState?.status === 'playing' && !inputDisabled;

  useEffect(() => {
    if (canSubmit) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [canSubmit]);

  const handleSubmit = () => {
    if (!canSubmit || !wordInput.trim()) return;
    submitWord(wordInput, () => setWordInput(''));
  };

  const handleLeave = () => {
    Alert.alert(
      'مغادرة اللعبة',
      'هل أنت متأكد أنك تريد مغادرة اللعبة؟',
      [
        { text: 'رجوع', style: 'cancel' },
        { text: 'مغادرة', style: 'destructive', onPress: leaveRoom },
      ]
    );
  };

  const turnPlayer = players.find(p => p.id === game?.currentTurnPlayerId);
  let bannerStyle = styles.bannerWaiting;
  let bannerText = `⏳ في انتظار: ${turnPlayer?.name || '...'}`;
  if (isPending && isMeTurn) {
    bannerStyle = styles.bannerPending;
    bannerText = '⏳ في انتظار قرار الحكم...';
  } else if (isMeTurn) {
    bannerStyle = styles.bannerActive;
    bannerText = '🎯 دورك الآن!';
  }

  // Pause overlay
  if (isPaused && roomState?.status === 'paused') {
    let pauseTitle = 'اللعبة متوقفة مؤقتاً';
    let pauseMsg = '';
    if (game.pausedReason === 'host') {
      pauseTitle = 'اللعبة متوقفة';
      pauseMsg = 'في انتظار عودة الحكم...';
    } else if (game.pausedReason === 'manual') {
      pauseTitle = 'استراحة قصيرة';
      pauseMsg = 'الحكم أوقف المؤقت — انتظر لحظة';
    } else {
      pauseMsg = `انقطع اتصال اللاعب: ${game.pausedForPlayerName || ''}`;
    }

    return (
      <View style={styles.container}>
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseIcon}>⏸</Text>
          <Text style={styles.pauseTitle}>{pauseTitle}</Text>
          <Text style={styles.pauseMsg}>{pauseMsg}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <View style={[styles.banner, bannerStyle]}>
          <Text style={styles.bannerText}>{bannerText}</Text>
        </View>
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Text style={styles.leaveBtnText}>خروج</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <WordDisplay
          currentWord={game?.currentWord}
          requiredLetter={game?.requiredLetter}
        />

        <TimerRing game={game} size={130} />

        <View style={[styles.submitArea, canSubmit && styles.submitAreaActive]}>
          <View style={styles.submitRow}>
            <TextInput
              ref={inputRef}
              style={[shared.input, styles.wordInput, !canSubmit && styles.inputDisabledStyle]}
              placeholder="اكتب كلمتك..."
              placeholderTextColor={colors.textDim}
              value={wordInput}
              onChangeText={setWordInput}
              maxLength={50}
              autoCorrect={false}
              editable={canSubmit}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={[shared.btn, shared.btnPrimary, styles.submitBtn, !canSubmit && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityLabel="إرسال"
            >
              <Text style={[shared.btnText, !canSubmit && { opacity: 0.5 }]}>إرسال</Text>
            </TouchableOpacity>
          </View>

          {!!submitError && <Text style={shared.errorMsg}>{submitError}</Text>}

          {showPendingNotice && (
            <View style={styles.pendingNotice}>
              <Text style={styles.pendingText}>بانتظار قرار الحكم على كلمتك</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  banner: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bannerWaiting: {
    backgroundColor: colors.surface2,
  },
  bannerActive: {
    backgroundColor: colors.success + '22',
    borderWidth: 1,
    borderColor: colors.success + '44',
  },
  bannerPending: {
    backgroundColor: colors.warm + '22',
    borderWidth: 1,
    borderColor: colors.warm + '44',
  },
  bannerText: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  leaveBtn: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leaveBtnText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.danger,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 30,
  },
  submitArea: {
    marginTop: 8,
  },
  submitAreaActive: {
    borderWidth: 1,
    borderColor: colors.success + '33',
    borderRadius: radius.lg,
    padding: 12,
    backgroundColor: colors.success + '08',
  },
  submitRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  wordInput: {
    flex: 1,
  },
  inputDisabledStyle: {
    opacity: 0.5,
  },
  submitBtn: {
    paddingHorizontal: 20,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  pendingNotice: {
    backgroundColor: colors.warm + '15',
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 8,
  },
  pendingText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.warm,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  pauseOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  pauseIcon: {
    fontSize: 48,
  },
  pauseTitle: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  pauseMsg: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
