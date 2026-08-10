import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, shared } from '../theme';
import { useGame } from '../GameProvider';

export default function WinnerScreen() {
  const { roomState, role, setScreen, closeRoom } = useGame();
  const winner = roomState?.lastWinner;
  const isHost = role === 'host';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.label}>الفائز</Text>
        <Text style={styles.name}>{winner?.name || 'لا يوجد فائز'}</Text>

        {isHost && (
          <View style={styles.btns}>
            <TouchableOpacity
              style={[shared.btn, shared.btnPrimary, shared.btnLg, styles.newGameBtn]}
              onPress={() => setScreen('host-lobby')}
              accessibilityLabel="بدء لعبة جديدة"
            >
              <Text style={shared.btnText}>بدء لعبة جديدة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitBtn}
              onPress={closeRoom}
            >
              <Text style={styles.exitBtnText}>إغلاق الغرفة</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  trophy: {
    fontSize: 64,
    marginBottom: 8,
  },
  label: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 15,
    color: colors.warm,
    textAlign: 'center',
  },
  name: {
    fontFamily: 'Tajawal_900Black',
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  btns: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  newGameBtn: {
    width: '100%',
  },
  exitBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  exitBtnText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.danger,
  },
});
