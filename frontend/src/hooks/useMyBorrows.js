import { useState, useCallback } from 'react';
import * as borrowApi from '../api/borrowingApi';
import * as resApi from '../api/reservationsApi';

export const useMyBorrows = () => {
  const [borrows, setBorrows] = useState({ records: [], total: 0 });
  const [reservations, setReservations] = useState([]);
  const [activeCount, setActiveCount] = useState({ activeBorrows: 0, maxAllowed: 5, canBorrowMore: true });
  const [loading, setLoading] = useState(false);

  const fetchMyBorrows = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await borrowApi.getMyBorrows(params);
      setBorrows(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await resApi.getMyReservations();
      setReservations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveCount = useCallback(async () => {
    try {
      const res = await borrowApi.getActiveCount();
      setActiveCount(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const cancelReservation = async (id) => {
    setLoading(true);
    try {
      await resApi.cancelReservation(id);
      await fetchMyReservations();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { borrows, reservations, loading, fetchMyBorrows, fetchMyReservations, fetchActiveCount, activeCount, cancelReservation };
};
