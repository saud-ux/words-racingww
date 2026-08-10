import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, radius, shared } from '../theme';
import { useGame } from '../GameProvider';
import WordDisplay from '../components/WordDisplay';

export default function EliminatedScreen() {
  const { roomState, elimReason, leaveRoom } = useGame();
  const game = roomState?.game;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>💀</Text>
        <Text style={styles.title}>خرجت من اللعبة</Text>
        {!!elimReason && <Text style={styles.reason}>{elimReason}</Text>}
      </View>

      <View style={styles.spectatorLabel}>
        <Text style={styles.spectatorText}>تابع كمشاهد</Text>
      </View>

      <WordDisplay
        currentWord={game?.currentWord}
        requiredLetter={game?.requiredLetter}
      />

      <TouchableOpacity style={styles.leaveBtn} onPress={leaveRoom}>
        <Text style={styles.leaveBtnText}>مغادرة الغرفة</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 16,
  },
  header: {
    backgroundColor: colors.danger + '15',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger + '33',
    padding: 24,
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  reason: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  spectatorLabel: {
    backgroundColor: colors.surface2,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  spectatorText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  leaveBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  leaveBtnText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.danger,
  },
});
