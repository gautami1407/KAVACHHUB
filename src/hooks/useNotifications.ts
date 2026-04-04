import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Notification as AppNotification, Role } from '@/lib/database.types';

export function useNotifications(userId?: string, role?: Role) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId && !role) return;

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (userId) {
      query = query.or(`user_id.eq.${userId},role_target.eq.${role || ''}`);
    } else if (role) {
      query = query.eq('role_target', role);
    }

    const { data } = await query;
    const notifs = (data as AppNotification[]) || [];
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  }, [userId, role]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as AppNotification;
        // Check if it's relevant to this user/role
        if (newNotif.user_id === userId || newNotif.role_target === role || (!newNotif.user_id && !newNotif.role_target)) {
          setNotifications(prev => [newNotif, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, role]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

  const sendNotification = useCallback(async (opts: {
    userId?: string;
    roleTarget?: Role;
    type: 'emergency' | 'info' | 'success';
    title: string;
    message: string;
  }) => {
    await supabase.from('notifications').insert({
      user_id: opts.userId || null,
      role_target: opts.roleTarget || null,
      type: opts.type,
      title: opts.title,
      message: opts.message,
    });
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendNotification,
    fetchNotifications,
  };
}
