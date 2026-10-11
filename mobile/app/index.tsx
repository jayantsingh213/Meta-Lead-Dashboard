import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';

import { Lead, ConnectionStatus } from '../constants/types';
import { BACKEND_URL } from '../constants/config';
import { getSocket } from '../services/socketService';
import ConnectionBadge from '../components/ConnectionBadge';
import StatsRow from '../components/StatsRow';
import LeadCard from '../components/LeadCard';
import EmptyState from '../components/EmptyState';

const sessionNewIds = new Set<string>();

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newCount = leads.filter((l) => sessionNewIds.has(l.metaLeadId)).length;

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/leads`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads.map((l: Lead) => ({
          ...l,
          isNew: sessionNewIds.has(l.metaLeadId),
        })));
        setError(null);
      } else {
        setError('Failed to load leads from server');
      }
    } catch (e: any) {
      setError(`Cannot reach backend: ${e.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onConnectError = () => setStatus('disconnected');

    const onNewLead = (lead: Lead) => {
      sessionNewIds.add(lead.metaLeadId);
      setLeads((prev) => {
        if (prev.some((l) => l.metaLeadId === lead.metaLeadId)) return prev;
        return [{ ...lead, isNew: true }, ...prev];
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('new_lead', onNewLead);

    if (socket.connected) setStatus('connected');

    fetchLeads();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('new_lead', onNewLead);
    };
  }, [fetchLeads]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeads();
  }, [fetchLeads]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Meta Leads</Text>
          <Text style={styles.headerSub}>Real-time Dashboard</Text>
        </View>
        <ConnectionBadge status={status} />
      </View>

      {!loading && <StatsRow total={leads.length} newCount={newCount} />}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️  {error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading leads…</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.metaLeadId}
          renderItem={({ item }) => <LeadCard lead={item} />}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={leads.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const HEADER_BG = '#0A0F1E';
const TEXT_MAIN = '#F0F4FF';
const TEXT_DIM = '#64748B';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: HEADER_BG,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },
  headerLeft: {},
  headerTitle: {
    color: TEXT_MAIN,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: TEXT_DIM,
    fontSize: 13,
    marginTop: 2,
  },
  list: {
    paddingBottom: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: TEXT_DIM,
    fontSize: 14,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 20,
  },
});
