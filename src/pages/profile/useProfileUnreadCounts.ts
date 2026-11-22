import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export function useProfileUnreadCounts(
  userId: string | undefined,
  isAmbassadorActive: boolean
) {
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    if (!userId) return;

    if (!isAmbassadorActive) {
      try {
        const { data: recipients } = await supabase
          .from('notification_recipients')
          .select('notification_id')
          .eq('user_id', userId)
          .eq('is_read', false);

        if (recipients && recipients.length > 0) {
          const notifIds = recipients.map(
            (recipient) => recipient.notification_id
          );

          const { count } = await supabase
            .from('notifications')
            .select('id', {
              count: 'exact',
              head: true,
            })
            .in('id', notifIds)
            .in('target_audience', [
              'CUSTOMER',
              'ALL',
              'SPECIFIC',
            ]);

          setUnreadNotifCount(count || 0);
        } else {
          setUnreadNotifCount(0);
        }
      } catch (err) {
        console.error(
          'Error fetching unread notification count:',
          err
        );
      }
    }

    if (isAmbassadorActive) {
      try {
        const { count } = await supabase
          .from('communications')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('channel_id', userId)
          .eq('is_read', false)
          .neq('sender_role', 'ambassador');

        setUnreadMessagesCount(count || 0);
      } catch (err) {
        console.error(
          'Error fetching unread messages count:',
          err
        );
      }
    }
  }, [userId, isAmbassadorActive]);

  useEffect(() => {
    if (!userId) return;

    fetchUnreadCounts();

    const notifChannel = supabase
      .channel(`profile_notif_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    const chatChannel = supabase
      .channel(`profile_chat_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications',
          filter: `channel_id=eq.${userId}`,
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [userId, fetchUnreadCounts]);

  return {
    unreadNotifCount,
    unreadMessagesCount,
    fetchUnreadCounts,
  };
}
