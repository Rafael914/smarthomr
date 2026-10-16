import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axios from 'axios';
import { router, useFocusEffect } from 'expo-router';
import { Storage } from '@/utils/storage';
import { BASE_URL } from '@/utils/api';

type Account = { id: number; name: string; email: string; role: string };

export default function Register() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    Promise.all([Storage.getItem('token'), Storage.getItem('role')]).then(([token, role]) => {
      if (!token) router.replace('/auth/login');
      else if (role !== 'admin') router.replace('/(tabs)');
      else setAuthorized(true);
    });
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const token = await Storage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
      setAccounts(response.data.users);
      setError('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load accounts.');
    }
  }, []);
  useFocusEffect(useCallback(() => { if (authorized) void loadAccounts(); }, [authorized, loadAccounts]));

  const createAccount = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const token = await Storage.getItem('token');
      await axios.post(`${BASE_URL}/api/auth/users`, { name, email, password, role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
      setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setNewRole('user');
      await loadAccounts();
      if (Platform.OS === 'web') alert(`${newRole === 'admin' ? 'Admin' : 'User'} account created.`); else Alert.alert('Account created', `The ${newRole} can now sign in.`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not create account.');
    }
  };

  const deleteAccount = (account: Account) => {
    const performDelete = async () => {
      try {
        const token = await Storage.getItem('token');
        await axios.delete(`${BASE_URL}/api/auth/users/${account.id}`, { headers: { Authorization: `Bearer ${token}` } });
        await loadAccounts();
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Could not delete account.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${account.name}'s account? They will lose access immediately.`)) void performDelete();
    } else {
      Alert.alert('Delete account?', `${account.name} will lose access immediately.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
      ]);
    }
  };

  if (!authorized) return <View style={styles.page} />;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Register a user</Text>
    <Text style={styles.subtitle}>Only an administrator can create or remove accounts.</Text>
    <View style={styles.card}>
      <Text style={styles.heading}>Create account</Text>
      <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#8392a5" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#8392a5" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password (6+ characters)" placeholderTextColor="#8392a5" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm password" placeholderTextColor="#8392a5" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} onSubmitEditing={createAccount} />
      <Text style={styles.fieldLabel}>Account role</Text>
      <View style={styles.rolePicker}>
        {(['user', 'admin'] as const).map((role) => <TouchableOpacity key={role} style={[styles.roleOption, newRole === role && styles.roleOptionSelected]} onPress={() => setNewRole(role)}>
          <Text style={[styles.roleOptionText, newRole === role && styles.roleOptionTextSelected]}>{role === 'admin' ? 'Administrator' : 'User'}</Text>
        </TouchableOpacity>)}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={createAccount}><Text style={styles.buttonText}>Create {newRole === 'admin' ? 'administrator' : 'user'}</Text></TouchableOpacity>
    </View>
    <View style={styles.card}>
      <Text style={styles.heading}>Existing accounts</Text>
      {accounts.map((account) => <View key={account.id} style={styles.row}>
        <View style={styles.accountDetails}>
          <Text style={styles.accountName}>{account.name}</Text><Text style={styles.accountEmail}>{account.email}</Text><Text style={styles.role}>{account.role}</Text>
        </View>
        {account.role !== 'admin' && <TouchableOpacity style={styles.deleteButton} onPress={() => deleteAccount(account)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>}
      </View>)}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#081522' }, content: { padding: 24, maxWidth: 760, width: '100%', alignSelf: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' }, subtitle: { color: '#9ca3af', marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: '#111e2c', borderColor: '#193148', borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 16 },
  heading: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 }, input: { backgroundColor: '#0b1723', color: '#fff', padding: 13, borderRadius: 10, marginBottom: 10, borderColor: '#263b50', borderWidth: 1 },
  fieldLabel: { color: '#cbd5e1', fontWeight: '700', marginTop: 4, marginBottom: 8 }, rolePicker: { flexDirection: 'row', gap: 10, marginBottom: 12 }, roleOption: { flex: 1, borderColor: '#263b50', borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center' }, roleOptionSelected: { borderColor: '#6ee7b7', backgroundColor: '#12352e' }, roleOptionText: { color: '#9ca3af', fontWeight: '700' }, roleOptionTextSelected: { color: '#6ee7b7' },
  button: { backgroundColor: '#6ee7b7', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 }, buttonText: { color: '#062018', fontWeight: '800' }, error: { color: '#f87171', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopColor: '#263b50', borderTopWidth: 1 }, accountDetails: { flex: 1 }, accountName: { color: '#fff', fontWeight: '700' }, accountEmail: { color: '#9ca3af', marginTop: 3 }, role: { color: '#6ee7b7', textTransform: 'capitalize', fontWeight: '700', marginTop: 3 },
  deleteButton: { borderColor: '#7f1d1d', borderWidth: 1, backgroundColor: '#2b1117', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 12 }, deleteText: { color: '#fca5a5', fontWeight: '700' },
});
