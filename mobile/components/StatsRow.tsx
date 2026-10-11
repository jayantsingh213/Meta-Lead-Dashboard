import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  total: number;
  newCount: number;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={[styles.card, { borderColor: accent + '40' }]}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function StatsRow({ total, newCount }: Props) {
  return (
    <View style={styles.row}>
      <StatCard label="Total Leads" value={total} accent="#6366F1" />
      <StatCard label="New Leads" value={newCount} accent="#10B981" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
});
