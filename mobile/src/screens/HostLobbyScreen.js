import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, shared } from '../theme';
import { useGame } from '../GameProvider';
import { requiredNextLetter } from '../utils';
import PlayerList from '../components/PlayerList';

const TIMER_OPTIONS = [
  { label: 'تلقائي', value: 'dynamic' },
  { label: '5 ث', value: 5 },
  { label: '10 ث', value: 10 },
  { label: '15 ث', value: 15 },
  { label: '20 ث', value: 20 },
  { label: '30 ث', value: 30 },
];

export default function HostLobbyScreen() {
  const {
    roomState, roomCode, startGame, setTimerMode,
    firstWordError, closeRoom, hostKickPlayer,
    setShowKickModal, setPendingKickPlayer,
  } = useGame();

  const [firstWord, setFirstWord] = useState('');
  const [copied, setCopied] = useState(false);

  const players = roomState?.players || [];
  const timerMode = roomState?.timerMode ?? 'dynamic';
  const nextLetter = firstWord.trim() ? requiredNextLetter(firstWord.trim()) : '';
  const canStart = firstWord.trim() && !/\s/.test(firstWord.trim()) && players.length > 0;

  const copyCode = async () => {
    await Clipboard.setStringAsync(roomCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleExit = () => {
    Alert.alert(
      'إغلاق الغرفة',
      'سيتم إنهاء الغرفة لجميع اللاعبين',
      [
        { text: 'رجوع', style: 'cancel' },
        { text: 'إغلاق', style: 'destructive', onPress: closeRoom },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={shared.roleBadge}>
        <Text style={shared.roleBadgeText}>الحكم / الهوست</Text>
      </View>

      <TouchableOpacity style={styles.codeBlock} onPress={copyCode} activeOpacity={0.7}>
        <Text style={styles.codeLabel}>رمز الغرفة</Text>
        <Text style={styles.code}>{roomCode || '----'}</Text>
        <Text style={styles.codeHint}>{copied ? 'تم النسخ!' : 'اضغط للنسخ'}</Text>
      </TouchableOpacity>

      <View style={[shared.card, styles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={shared.sectionTitle}>اللاعبون المنضمون</Text>
          <View style={shared.countBadge}>
            <Text style={shared.countBadgeText}>{players.length}</Text>
          </View>
        </View>
        <PlayerList players={players} canKick onKick={handleKick} />
      </View>

      <View style={[shared.card, styles.section]}>
        <Text style={shared.sectionTitle}>وقت كل دور</Text>
        <View style={styles.timerOpts}>
          {TIMER_OPTIONS.map(opt => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[
                styles.timerOpt,
                timerMode === opt.value && styles.timerOptActive,
              ]}
              onPress={() => setTimerMode(opt.value)}
            >
              <Text style={[
                styles.timerOptText,
                timerMode === opt.value && styles.timerOptTextActive,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[shared.card, styles.section]}>
        <Text style={shared.sectionTitle}>الكلمة الأولى</Text>
        <Text style={styles.hint}>اكتب الكلمة التي تبدأ بها اللعبة</Text>
        <View style={styles.firstWordRow}>
          <TextInput
            style={[shared.input, styles.firstWordInput]}
            placeholder="مثال: مدرسة"
            placeholderTextColor={colors.textDim}
            value={firstWord}
            onChangeText={setFirstWord}
            maxLength={50}
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => canStart && startGame(firstWord)}
          />
          {!!nextLetter && (
            <View style={styles.letterPreview}>
              <Text style={styles.letterArrow}>←</Text>
              <Text style={styles.letterValue}>{nextLetter}</Text>
            </View>
          )}
        </View>
        {!!firstWordError && <Text style={shared.errorMsg}>{firstWordError}</Text>}
      </View>

      <TouchableOpacity
        style={[shared.btn, shared.btnPrimary, shared.btnLg, styles.startBtn, !canStart && styles.btnDisabled]}
        onPress={() => startGame(firstWord)}
        disabled={!canStart}
        accessibilityLabel="بدء اللعبة"
      >
        <Text style={[shared.btnText, !canStart && styles.btnTextDisabled]}>
          {roomState?.lastWinner ? '🔄 بدء اللعبة' : '▶ بدء اللعبة'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
        <Text style={styles.exitBtnText}>إغلاق الغرفة</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  codeBlock: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 14,
  },
  codeLabel: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.textDim,
    marginBottom: 4,
  },
  code: {
    fontFamily: 'Tajawal_900Black',
    fontSize: 40,
    color: colors.accent,
    letterSpacing: 8,
  },
  codeHint: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 12,
    color: colors.textDim,
    marginTop: 4,
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerOpts: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  timerOpt: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  timerOptActive: {
    backgroundColor: colors.accent + '22',
    borderColor: colors.accent,
  },
  timerOptText: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 14,
    color: colors.textMuted,
  },
  timerOptTextActive: {
    color: colors.accent,
  },
  hint: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  firstWordRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  firstWordInput: {
    flex: 1,
  },
  letterPreview: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  letterArrow: {
    fontSize: 14,
    color: colors.textDim,
  },
  letterValue: {
    fontFamily: 'Tajawal_900Black',
    fontSize: 22,
    color: colors.accent,
  },
  startBtn: {
    marginTop: 6,
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnTextDisabled: {
    opacity: 0.6,
  },
  exitBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  exitBtnText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
});
