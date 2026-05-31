import { useState } from 'react';
import * as api from '../api/borrowingApi';

export const useBorrowing = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitRequest = async (data) => {
    setLoading(true); setError(null);
    try {
      const res = await api.submitBorrowRequest(data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSession = async (code) => {
    setLoading(true); setError(null);
    try {
      const res = await api.getSession(code);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmCollection = async (code, data) => {
    setLoading(true); setError(null);
    try {
      const res = await api.confirmCollection(code, data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOverdue = async (params) => {
    setLoading(true); setError(null);
    try {
      const res = await api.getOverdueRecords(params);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSessions = async (params) => {
    setLoading(true); setError(null);
    try {
      const res = await api.getAllSessions(params);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (code) => {
    setLoading(true); setError(null);
    try {
      const res = await api.cancelRequest(code);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitRequest, confirmCollection, getSession, getOverdue, getSessions, cancelRequest, loading, error };
};
