import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function WordDisplay({ currentWord, requiredLetter }) {
  return (
    <View style={styles.container}>
      <View style={styles.wordSection}>
        <Text style={styles.label}>الكلمة الحالية</Text>
        <Text style={styles.word}>{currentWord || '—'}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.letterSection}>
        <Text style={styles.label}>الحرف التالي</Text>
        <Text style={styles.letter}>{requiredLetter || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    width: '100%',
  },
  wordSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.textDim,
    marginBottom: 6,
    textAlign: 'center',
  },
  word: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
  letterSection: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 10,
  },
  letter: {
    fontFamily: 'Tajawal_900Black',
    fontSize: 28,
    color: colors.accent,
    textAlign: 'center',
  },
});
