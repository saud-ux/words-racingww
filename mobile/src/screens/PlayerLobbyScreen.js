import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, shared } from '../theme';
import { useGame } from '../GameProvider';
import PlayerList from '../components/PlayerList';

export default function PlayerLobbyScreen() {
  const { roomState, roomCode, playerId, leaveRoom } = useGame();
  const players = roomState?.players || [];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.codeBlock}>
        <Text style={styles.codeLabel}>غرفة</Text>
        <Text style={styles.code}>{roomCode || '----'}</Text>
      </View>

      <View style={styles.waitingRow}>
        <Text style={styles.waitingIcon}>⏳</Text>
        <Text style={styles.waitingText}>في انتظار الهوست ليبدأ اللعبة</Text>
      </View>

      <View style={[shared.card, styles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={shared.sectionTitle}>اللاعبون</Text>
          <View style={shared.countBadge}>
            <Text style={shared.countBadgeText}>{players.length}</Text>
          </View>
        </View>
        <PlayerList players={players} selfId={playerId} />
      </View>

      <TouchableOpacity
        style={[shared.btn, shared.btnSecondary, styles.leaveBtn]}
        onPress={leaveRoom}
        accessibilityLabel="مغادرة الغرفة"
      >
        <Text style={[shared.btnTextSecondary, { color: colors.danger }]}>مغادرة الغرفة</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  codeBlock: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    width: '100%',
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
    fontSize: 36,
    color: colors.accent,
    letterSpacing: 8,
  },
  waitingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  waitingIcon: {
    fontSize: 20,
  },
  waitingText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  leaveBtn: {
    borderColor: colors.danger + '44',
  },
});
