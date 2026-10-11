import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Lead } from '../constants/types';

interface Props {
  lead: Lead;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function LeadCard({ lead }: Props) {
  const fadeAnim = useRef(new Animated.Value(lead.isNew ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(lead.isNew ? -20 : 0)).current;

  useEffect(() => {
    if (lead.isNew) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        lead.isNew && styles.newCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
        {lead.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      <DetailRow icon="✉️" value={lead.email} />
      <DetailRow icon="📞" value={lead.phone} />

      <View style={styles.footer}>
        <Text style={styles.leadId} numberOfLines={1}>ID: {lead.metaLeadId}</Text>
        <Text style={styles.time}>{formatDate(lead.receivedAt)}</Text>
      </View>
    </Animated.View>
  );
}

function DetailRow({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.detailText} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131929',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  newCard: {
    borderColor: '#10B981',
    backgroundColor: '#0D1F19',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  name: {
    color: '#F0F4FF',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  detailText: {
    color: '#94A3B8',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  leadId: {
    color: '#475569',
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
  },
  time: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 8,
  },
});
