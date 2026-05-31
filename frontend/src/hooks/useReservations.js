import { useState, useCallback } from 'react';
import * as resApi from '../api/reservationsApi';

export const useReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReservations = useCallback(async (params) => {
    setLoading(true); setError(null);
    try {
      const res = await resApi.getAllReservations(params);
      setReservations(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQueue = useCallback(async (copyId) => {
    setLoading(true); setError(null);
    try {
      const res = await resApi.getQueueForCopy(copyId);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelReservation = async (id) => {
    setLoading(true); setError(null);
    try {
      await resApi.cancelReservation(id);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { reservations, loading, error, fetchReservations, fetchQueue, cancelReservation };
};
