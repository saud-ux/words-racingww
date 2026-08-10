import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { colors, radius, shared } from '../theme';
import { useGame } from '../GameProvider';

export default function LandingScreen() {
  const { createRoom, joinRoom, landingError } = useGame();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const handleJoin = () => {
    joinRoom(roomCodeInput, nameInput);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.logo}>⚡</Text>
          <Text style={styles.title}>سباق الكلمات</Text>
          <Text style={styles.subtitle}>لعبة تسلسل الكلمات العربية</Text>

          <TouchableOpacity
            style={[shared.btn, shared.btnPrimary, shared.btnLg, styles.createBtn]}
            onPress={createRoom}
            accessibilityLabel="إنشاء غرفة"
            accessibilityRole="button"
          >
            <Text style={shared.btnText}>إنشاء غرفة (هوست)</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={[shared.input, styles.inputCode]}
            placeholder="رمز الغرفة"
            placeholderTextColor={colors.textDim}
            value={roomCodeInput}
            onChangeText={t => setRoomCodeInput(t.toUpperCase())}
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="next"
          />

          <TextInput
            style={[shared.input, styles.inputName]}
            placeholder="اسمك في اللعبة"
            placeholderTextColor={colors.textDim}
            value={nameInput}
            onChangeText={setNameInput}
            maxLength={30}
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleJoin}
          />

          <TouchableOpacity
            style={[shared.btn, shared.btnSecondary, shared.btnLg, styles.joinBtn]}
            onPress={handleJoin}
            accessibilityLabel="انضمام كلاعب"
            accessibilityRole="button"
          >
            <Text style={shared.btnTextSecondary}>انضمام كلاعب</Text>
          </TouchableOpacity>

          {!!landingError && (
            <Text style={shared.errorMsg}>{landingError}</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Tajawal_900Black',
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 24,
  },
  createBtn: {
    width: '100%',
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.textDim,
    marginHorizontal: 12,
  },
  inputCode: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Tajawal_700Bold',
    letterSpacing: 6,
    marginBottom: 10,
  },
  inputName: {
    width: '100%',
    marginBottom: 12,
  },
  joinBtn: {
    width: '100%',
  },
});
