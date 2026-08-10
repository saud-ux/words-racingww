import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { computeRemaining, timerColor } from '../utils';
import { colors } from '../theme';

const RING_C = 2 * Math.PI * 45;

export default function TimerRing({ game, size = 120 }) {
  const gameRef = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  const [display, setDisplay] = useState({ rem: 0, total: 10, color: colors.timerGreen });

  useEffect(() => {
    const interval = setInterval(() => {
      const g = gameRef.current;
      const total = g?.timerSeconds || 10;
      const rem = computeRemaining(g);
      setDisplay({ rem, total, color: timerColor(rem) });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const { rem, total, color } = display;
  const pct = total > 0 ? rem / total : 0;
  const offset = RING_C * (1 - pct);
  const displayNum = game ? Math.ceil(rem) : '—';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg viewBox="0 0 100 100" width={size} height={size}>
        <Circle cx={50} cy={50} r={45} stroke={colors.surface2} strokeWidth={5} fill="none" />
        <Circle
          cx={50} cy={50} r={45}
          stroke={color} strokeWidth={5} fill="none"
          strokeDasharray={`${RING_C}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin="50,50"
        />
      </Svg>
      <Text style={[styles.number, { color, fontSize: rem <= 2 ? 32 : rem <= 4 ? 28 : 26 }]}>
        {displayNum}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },
  number: {
    position: 'absolute',
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center',
  },
});
