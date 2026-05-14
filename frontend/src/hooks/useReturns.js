import { useState } from 'react';
import * as borrowApi from '../api/borrowingApi';
import * as returnsApi from '../api/returnsApi';

export const useReturns = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processReturn = async (data) => {
    setLoading(true); setError(null);
    try {
      const res = await borrowApi.processReturn(data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getReturns = async (params) => {
    setLoading(true); setError(null);
    try {
      const res = await returnsApi.getAllReturns(params);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { processReturn, getReturns, loading, error };
};
