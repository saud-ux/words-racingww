import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Switch, Alert, Linking } from 'react-native';
import { colors, radius, shared } from '../theme';
import { useGame } from '../GameProvider';

const APP_VERSION = '1.0.0';
const PRIVACY_POLICY_URL = 'https://wordsracing.app/privacy';

export default function SettingsModal({ visible, onClose }) {
  const {
    soundEnabled, toggleSound, role, screen,
    logout, deleteAllData,
  } = useGame();

  const [showPrivacy, setShowPrivacy] = useState(false);
  const isInRoom = role !== null && screen !== 'landing';

  const handleLogout = () => {
    if (isInRoom) {
      Alert.alert(
        'تسجيل الخروج',
        'ستتم مغادرة الغرفة الحالية ومسح بيانات الجلسة. هل تريد المتابعة؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الخروج', style: 'destructive', onPress: () => { logout(); onClose(); } },
        ]
      );
    } else {
      logout();
      onClose();
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'حذف جميع البيانات',
      'سيتم حذف جميع البيانات المحفوظة على هذا الجهاز بما في ذلك بيانات الجلسة والإعدادات. لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'تأكيد الحذف',
              'هل أنت متأكد؟ سيتم حذف كل شيء نهائياً.',
              [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'نعم، احذف الكل', style: 'destructive', onPress: () => { deleteAllData(); onClose(); } },
              ]
            );
          },
        },
      ]
    );
  };

  if (showPrivacy) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.privacyContainer}>
          <View style={styles.privacyHeader}>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
              <Text style={styles.backBtn}>→ رجوع</Text>
            </TouchableOpacity>
            <Text style={styles.privacyHeaderTitle}>سياسة الخصوصية</Text>
          </View>
          <ScrollView style={styles.privacyScroll} contentContainerStyle={styles.privacyContent}>
            <PrivacyPolicyContent />
          </ScrollView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>الإعدادات</Text>

          {/* Sound */}
          <View style={styles.row}>
            <Text style={styles.rowIcon}>🔊</Text>
            <Text style={styles.rowLabel}>المؤثرات الصوتية</Text>
            <Switch
              value={soundEnabled}
              onValueChange={toggleSound}
              trackColor={{ false: colors.surface3, true: colors.accentDim }}
              thumbColor={soundEnabled ? colors.accent : colors.textDim}
            />
          </View>

          <View style={styles.separator} />

          {/* Logout */}
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Text style={styles.rowIcon}>📤</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>تسجيل الخروج</Text>
              <Text style={styles.rowDesc}>
                {isInRoom
                  ? 'مغادرة الغرفة الحالية ومسح بيانات الجلسة'
                  : 'مسح بيانات الجلسة المحفوظة'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Delete all data */}
          <TouchableOpacity style={styles.row} onPress={handleDeleteData}>
            <Text style={styles.rowIcon}>🗑️</Text>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>حذف جميع البيانات</Text>
              <Text style={styles.rowDesc}>مسح جميع البيانات المحفوظة على الجهاز نهائياً</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Privacy Policy */}
          <TouchableOpacity style={styles.row} onPress={() => setShowPrivacy(true)}>
            <Text style={styles.rowIcon}>🔒</Text>
            <Text style={styles.rowLabel}>سياسة الخصوصية</Text>
            <Text style={styles.rowArrow}>←</Text>
          </TouchableOpacity>

          {/* Terms */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => setShowPrivacy(true))}
          >
            <Text style={styles.rowIcon}>📋</Text>
            <Text style={styles.rowLabel}>شروط الاستخدام</Text>
            <Text style={styles.rowArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* About */}
          <View style={styles.aboutSection}>
            <Text style={styles.aboutLogo}>⚡</Text>
            <Text style={styles.aboutName}>سباق الكلمات</Text>
            <Text style={styles.aboutVersion}>الإصدار {APP_VERSION}</Text>
            <Text style={styles.aboutDesc}>لعبة تسلسل الكلمات العربية في الوقت الفعلي</Text>
          </View>

          {/* Close */}
          <TouchableOpacity
            style={[shared.btn, shared.btnSecondary, styles.closeBtn]}
            onPress={onClose}
          >
            <Text style={shared.btnTextSecondary}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PrivacyPolicyContent() {
  return (
    <View style={styles.policyBody}>
      <Text style={styles.policyTitle}>سياسة الخصوصية — سباق الكلمات</Text>
      <Text style={styles.policyDate}>آخر تحديث: ٢٠٢٦/٠٨/١٠</Text>

      <Text style={styles.policyHeading}>١. ما البيانات التي نجمعها</Text>
      <Text style={styles.policyText}>
        {'• '}الاسم المستعار الذي تختاره عند الانضمام للغرفة (لا نطلب اسمك الحقيقي){'\n'}
        {'• '}رمز الجلسة المؤقت للحفاظ على اتصالك بالغرفة{'\n'}
        {'• '}تفضيل الصوت (مفعل/معطل){'\n\n'}
        لا نجمع: البريد الإلكتروني، رقم الهاتف، الموقع الجغرافي، جهات الاتصال، الصور، أو أي بيانات شخصية أخرى.
      </Text>

      <Text style={styles.policyHeading}>٢. أين تُحفظ البيانات</Text>
      <Text style={styles.policyText}>
        جميع البيانات تُحفظ محلياً على جهازك فقط. لا نرسل أي بيانات شخصية إلى خوادم خارجية.
        بيانات اللعبة (الكلمات المستخدمة، حالة الغرفة) تُحفظ مؤقتاً على السيرفر أثناء اللعب وتُحذف تلقائياً عند انتهاء الغرفة.
      </Text>

      <Text style={styles.policyHeading}>٣. مشاركة البيانات</Text>
      <Text style={styles.policyText}>
        لا نبيع أو نشارك أو نرسل أي بيانات لأطراف ثالثة. لا نستخدم أدوات تتبع أو إعلانات أو تحليلات.
      </Text>

      <Text style={styles.policyHeading}>٤. حذف البيانات</Text>
      <Text style={styles.policyText}>
        يمكنك حذف جميع بياناتك في أي وقت من خلال:{'\n'}
        {'• '}الإعدادات → حذف جميع البيانات{'\n'}
        {'• '}الإعدادات → تسجيل الخروج{'\n'}
        {'• '}حذف التطبيق من جهازك{'\n\n'}
        عند الحذف، تُزال جميع البيانات المحفوظة محلياً بشكل فوري ونهائي.
      </Text>

      <Text style={styles.policyHeading}>٥. الأطفال</Text>
      <Text style={styles.policyText}>
        هذا التطبيق مناسب لجميع الأعمار. لا نجمع بيانات شخصية من أي مستخدم بما في ذلك الأطفال.
      </Text>

      <Text style={styles.policyHeading}>٦. التغييرات</Text>
      <Text style={styles.policyText}>
        قد نحدّث هذه السياسة من وقت لآخر. ستظهر التحديثات داخل التطبيق.
      </Text>

      <Text style={styles.policyHeading}>٧. التواصل</Text>
      <Text style={styles.policyText}>
        لأي استفسار حول الخصوصية، يرجى التواصل عبر البريد الإلكتروني:{'\n'}
        privacy@wordsracing.app
      </Text>

      <Text style={[styles.policyTitle, { marginTop: 30 }]}>Privacy Policy — Words Racing</Text>

      <Text style={styles.policyHeading}>1. Data We Collect</Text>
      <Text style={styles.policyText}>
        {'• '}A display name you choose when joining a room (not your real name){'\n'}
        {'• '}A temporary session token to maintain your connection{'\n'}
        {'• '}Sound preference (on/off){'\n\n'}
        We do NOT collect: email, phone number, location, contacts, photos, or any other personal data.
      </Text>

      <Text style={styles.policyHeading}>2. Data Storage</Text>
      <Text style={styles.policyText}>
        All data is stored locally on your device only. No personal data is sent to external servers.
        Game data (used words, room state) is temporarily stored on the game server during play and automatically deleted when the room closes.
      </Text>

      <Text style={styles.policyHeading}>3. Data Sharing</Text>
      <Text style={styles.policyText}>
        We do not sell, share, or transmit any data to third parties. We do not use tracking tools, ads, or analytics.
      </Text>

      <Text style={styles.policyHeading}>4. Data Deletion</Text>
      <Text style={styles.policyText}>
        You can delete all your data at any time via:{'\n'}
        {'• '}Settings → Delete All Data{'\n'}
        {'• '}Settings → Logout{'\n'}
        {'• '}Uninstalling the app{'\n\n'}
        Deletion is immediate and permanent.
      </Text>

      <Text style={styles.policyHeading}>5. Children</Text>
      <Text style={styles.policyText}>
        This app is suitable for all ages. We do not collect personal data from any user, including children.
      </Text>

      <Text style={styles.policyHeading}>6. Contact</Text>
      <Text style={styles.policyText}>
        For privacy inquiries: privacy@wordsracing.app
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textDim,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowContent: {
    flex: 1,
  },
  rowDesc: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  rowArrow: {
    fontSize: 16,
    color: colors.textDim,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  aboutSection: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  aboutLogo: { fontSize: 28 },
  aboutName: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 16,
    color: colors.text,
  },
  aboutVersion: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 13,
    color: colors.textDim,
  },
  aboutDesc: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  closeBtn: {
    marginTop: 8,
  },

  // Privacy policy screen
  privacyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  privacyHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
    color: colors.accent,
  },
  privacyHeaderTitle: {
    flex: 1,
    fontFamily: 'Tajawal_700Bold',
    fontSize: 17,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  privacyScroll: {
    flex: 1,
  },
  privacyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  policyBody: {},
  policyTitle: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 20,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  policyDate: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  policyHeading: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
    color: colors.warm,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 18,
    marginBottom: 6,
  },
  policyText: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
});
