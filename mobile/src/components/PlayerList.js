import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function PlayerList({ players, currentTurnId, selfId, canKick, onKick }) {
  if (!players || players.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>لا يوجد لاعبون</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {players.map(p => (
        <PlayerItem
          key={p.id} player={p}
          isCurrent={p.id === currentTurnId}
          isSelf={p.id === selfId}
          canKick={canKick && !p.eliminated}
          onKick={onKick}
        />
      ))}
    </View>
  );
}

function PlayerItem({ player, isCurrent, isSelf, canKick, onKick }) {
  const p = player;
  const avatarColor = p.eliminated ? colors.dangerDim
    : isCurrent ? colors.success
    : colors.accentDim;

  const tags = [];
  if (isSelf) tags.push({ text: 'أنت', color: colors.info });
  if (isCurrent) tags.push({ text: 'دوره الآن', color: colors.success });
  if (!p.connected && !p.eliminated) tags.push({ text: 'منقطع', color: colors.danger });
  if (p.eliminated) tags.push({ text: p.eliminationReason || 'خرج', color: colors.dangerDim });

  return (
    <View style={[
      styles.item,
      isCurrent && styles.itemCurrent,
      p.eliminated && styles.itemEliminated,
    ]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{p.name.charAt(0)}</Text>
      </View>
      <Text style={[styles.name, p.eliminated && styles.nameElim]} numberOfLines={1}>
        {p.name}
      </Text>
      <View style={styles.tags}>
        {tags.map((t, i) => (
          <View key={i} style={[styles.tag, { backgroundColor: t.color + '22', borderColor: t.color + '44' }]}>
            <Text style={[styles.tagText, { color: t.color }]}>{t.text}</Text>
          </View>
        ))}
      </View>
      {canKick && (
        <TouchableOpacity
          style={styles.kickBtn}
          onPress={() => onKick?.(p)}
          accessibilityLabel={`طرد ${p.name}`}
        >
          <Text style={styles.kickText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 6,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  itemCurrent: {
    borderWidth: 1,
    borderColor: colors.success + '44',
    backgroundColor: colors.success + '0a',
  },
  itemEliminated: {
    opacity: 0.5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 16,
    color: '#fff',
  },
  name: {
    flex: 1,
    fontFamily: 'Tajawal_700Bold',
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  nameElim: {
    color: colors.textDim,
    textDecorationLine: 'line-through',
  },
  tags: {
    flexDirection: 'row-reverse',
    gap: 4,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 11,
  },
  kickBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kickText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '700',
  },
});
