import React, { useCallback, useState } from 'react';
import { View, I18nManager, StyleSheet, Text, TouchableOpacity, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
  Tajawal_900Black,
} from '@expo-google-fonts/tajawal';

import { GameProvider, useGame } from './src/GameProvider';
import { colors } from './src/theme';

import LandingScreen from './src/screens/LandingScreen';
import HostLobbyScreen from './src/screens/HostLobbyScreen';
import PlayerLobbyScreen from './src/screens/PlayerLobbyScreen';
import HostGameScreen from './src/screens/HostGameScreen';
import PlayerGameScreen from './src/screens/PlayerGameScreen';
import EliminatedScreen from './src/screens/EliminatedScreen';
import WinnerScreen from './src/screens/WinnerScreen';
import SettingsModal from './src/components/SettingsModal';

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync();

function ScreenRouter() {
  const { screen, connected } = useGame();
  const [settingsVisible, setSettingsVisible] = useState(false);

  React.useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsVisible) {
        setSettingsVisible(false);
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [settingsVisible]);

  const screens = {
    'landing': LandingScreen,
    'host-lobby': HostLobbyScreen,
    'player-lobby': PlayerLobbyScreen,
    'host-game': HostGameScreen,
    'player-game': PlayerGameScreen,
    'eliminated': EliminatedScreen,
    'winner': WinnerScreen,
  };

  const Screen = screens[screen] || LandingScreen;

  return (
    <View style={styles.container}>
      {!connected && (
        <View style={styles.connectionBar}>
          <Text style={styles.connectionText}>جاري الاتصال بالسيرفر...</Text>
        </View>
      )}
      <Screen />

      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => setSettingsVisible(true)}
        accessibilityLabel="الإعدادات"
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    Tajawal_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <SafeAreaView style={styles.safe} onLayout={onLayoutRootView}>
        <GameProvider>
          <ScreenRouter />
        </GameProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  connectionBar: {
    backgroundColor: colors.danger + '22',
    borderBottomWidth: 1,
    borderBottomColor: colors.danger + '44',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  connectionText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  settingsBtn: {
    position: 'absolute',
    top: 8,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  settingsIcon: {
    fontSize: 20,
  },
});
