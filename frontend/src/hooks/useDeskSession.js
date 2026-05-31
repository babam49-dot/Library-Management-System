import { useState } from 'react';
import * as borrowApi from '../api/borrowingApi';

export const useDeskSession = () => {
  const [sessionData, setSessionData] = useState(null);
  const [lookupCode, setLookupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const lookupSession = async (code) => {
    setIsLoading(true); setError(null);
    try {
      const res = await borrowApi.getSession(code);
      setSessionData(res.data.data);
      setLookupCode(code);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setSessionData(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSession = async (code, data) => {
    setIsLoading(true); setError(null);
    try {
      const res = await borrowApi.confirmCollection(code, data);
      await lookupSession(code); // Refresh session after confirmation
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    setSessionData(null);
    setLookupCode('');
    setError(null);
  };

  return { lookupCode, setLookupCode, sessionData, lookupSession, confirmSession, clearSession, isLoading, error };
};
