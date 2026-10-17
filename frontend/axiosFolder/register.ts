import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState('');
  import { BASE_URL } from '@/utils/api';
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