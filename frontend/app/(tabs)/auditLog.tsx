import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '@/utils/api';
import { Storage } from '@/utils/storage';

type AuditEntry = {
  id: number;
  username: string;
  email: string;
  relay: string;
  action: 'ON' | 'OFF';
  occurred_at: string;
};

const colors = { bg: '#081522', panel: '#102235', border: '#193148', text: '#eef5fb', muted: '#9aafc2', green: '#6ee7b7', red: '#fca5a5' };

export default function AuditLogScreen() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const token = await Storage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/relay/audit?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
      });
      setEntries(response.data.entries || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load relay activity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, maxWidth: 980, width: '100%', alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 25, fontWeight: '800' }}>Relay audit log</Text>
        <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={{ backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 }}>
          <Text style={{ color: colors.green, fontWeight: '700' }}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: colors.muted, marginBottom: 18 }}>Relay state changes, the account that made them, and the time recorded by the server.</Text>
      {loading ? <ActivityIndicator color={colors.green} style={{ marginTop: 28 }} /> : null}
      {!!error && <Text style={{ color: colors.red, padding: 14 }}>{error}</Text>}
      {!loading && !error && entries.length === 0 && <Text style={{ color: colors.muted, padding: 16, backgroundColor: colors.panel, borderRadius: 10 }}>No relay changes have been recorded yet.</Text>}
      {entries.map((entry) => (
        <View key={entry.id} style={{ backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 11, padding: 15, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{entry.username} <Text style={{ color: colors.muted, fontWeight: '400' }}>({entry.email})</Text></Text>
            <Text style={{ color: colors.muted, marginTop: 5 }}>{entry.relay.replace('relay', 'Relay ')} · {new Date(entry.occurred_at).toLocaleString()}</Text>
          </View>
          <Text style={{ color: entry.action === 'ON' ? colors.green : colors.red, fontWeight: '900', minWidth: 40, textAlign: 'right' }}>{entry.action}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
