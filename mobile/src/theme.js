import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#141210',
  bg2: '#1a1714',
  surface: '#221e1a',
  surface2: '#2c2720',
  surface3: '#373028',
  border: '#4a4238',
  borderSoft: '#3a342c',

  accent: '#8fad7c',
  accentDim: '#5e7a50',

  warm: '#c4a882',
  warmDim: '#8a7558',

  success: '#7ab89a',
  successDim: '#4e8068',

  danger: '#c47c6a',
  dangerDim: '#8a5448',

  info: '#7a9aba',

  text: '#e8e0d5',
  textMuted: '#a89880',
  textDim: '#6e6050',

  timerGreen: '#7a9a6a',
  timerYellow: '#978F66',
  timerOrange: '#C4A060',
  timerRed: '#C4702A',
};

export const radius = {
  lg: 14,
  md: 9,
  sm: 6,
};

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    width: '100%',
  },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnSecondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnText: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
    color: colors.bg,
  },
  btnTextSecondary: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
    color: colors.text,
  },
  btnTextDanger: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  btnLg: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  btnSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Tajawal_500Medium',
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionTitle: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorMsg: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.danger,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  roleBadge: {
    alignSelf: 'center',
    backgroundColor: colors.warm + '22',
    borderWidth: 1,
    borderColor: colors.warm + '44',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  roleBadgeText: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 13,
    color: colors.warm,
    textAlign: 'center',
  },
  countBadge: {
    backgroundColor: colors.surface3,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  countBadgeText: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 12,
    color: colors.textMuted,
  },
});
