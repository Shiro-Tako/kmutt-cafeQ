// โหลดออเดอร์เป็นระยะและเก็บว่าอ่านการแจ้งเตือนรายการไหนแล้ว
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOrders } from '../services/orders.js';
import { useApiResource } from './useApiResource.js';
import useStoredState from './useStoredState.js';
import { getOrderNotification } from '../data/orderNotifications.js';

export default function useOrderNotifications(account, cafes, enabled, menu) {
  const userId = account?.userId;
  const load = useCallback((signal) => userId ? getOrders(signal) : null, [userId]);
  const resource = useApiResource(load, enabled && Boolean(userId), 5000);
  const [memory, setMemory] = useStoredState('cafeq-order-notifications', {});
  const [toast, setToast] = useState(null);
  const notifications = useMemo(() => (resource.data?.items ?? [])
    .map((order) => getOrderNotification(order, cafes, menu))
    .filter(Boolean)
    .map((item) => ({ ...item, unread: !(memory?.[userId]?.read ?? []).includes(item.key) })), [resource.data, cafes, menu, memory, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;
    const refresh = () => { if (document.visibilityState === 'visible') resource.refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [enabled, userId, resource.refresh]);

  useEffect(() => {
    if (!userId) return;
    const announced = memory?.[userId]?.announced ?? [];
    const fresh = notifications.filter((item) => !announced.includes(item.key));
    if (!fresh.length) return;
    setToast({ ...fresh[0], userId });
    setMemory((current) => ({ ...current, [userId]: {
      ...current?.[userId],
      announced: [...new Set([...(current?.[userId]?.announced ?? []), ...fresh.map((item) => item.key)])],
    } }));
  }, [notifications, userId, memory, setMemory]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  function markRead(keys = notifications.map((item) => item.key)) {
    if (!userId) return;
    setMemory((current) => ({ ...current, [userId]: {
      ...current?.[userId],
      read: [...new Set([...(current?.[userId]?.read ?? []), ...keys])],
    } }));
    setToast(null);
  }

  return {
    items: notifications,
    unreadCount: notifications.filter((item) => item.unread).length,
    toast: enabled && toast?.userId === userId && notifications.some((item) => item.key === toast.key) ? toast : null,
    markRead, dismissToast: () => setToast(null), loading: resource.loading, error: resource.error, refresh: resource.refresh,
  };
}
