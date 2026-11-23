import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useGlobalLoading } from '../../context/LoadingContext';
import {
  ProfileViewType,
  PortalModeType,
  resolveSkeletonViewForState,
} from './profileTypes';
import { useProfileAvatar } from './useProfileAvatar';
import { useProfileSettings } from './useProfileSettings';

export function useProfileController() {
  const navigate = useNavigate();
  const { setIsPageLoading } = useGlobalLoading();
  const pageLoadingTokenRef = useRef<number | null>(null);

  const initialView: ProfileViewType = (() => {
    const saved = localStorage.getItem(
      'currentView'
    ) as ProfileViewType | null;

    if (
      saved === 'settings' ||
      saved === 'notifications' ||
      saved === 'communication' ||
      saved === 'profile'
    ) {
      return saved;
    }

    return 'profile';
  })();

  const initialPortalMode: PortalModeType = (() => {
    const saved = localStorage.getItem('portalMode');
    return saved === 'ambassador' ? 'ambassador' : 'customer';
  })();

  const [view, setView] = useState<ProfileViewType>(initialView);
  const [portalMode, setPortalMode] =
    useState<PortalModeType>(initialPortalMode);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);
  const [, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const [currentSlug, setCurrentSlug] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bKash');
  const [currentPayoutDetails, setCurrentPayoutDetails] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const isAmbassador =
    String(profile?.role).toUpperCase().trim() === 'AMBASSADOR';

  const isAmbassadorActive = Boolean(
    profile && isAmbassador && portalMode === 'ambassador'
  );

  const resolvedAmbassadorMode = profile
    ? isAmbassadorActive
    : initialPortalMode === 'ambassador';

  const startPageLoading = useCallback(
    (targetView: ProfileViewType, targetAmbassadorActive: boolean) => {
      const token = setIsPageLoading(true, {
        view: resolveSkeletonViewForState(
          targetView,
          targetAmbassadorActive
        ),
        isAmbassador: targetAmbassadorActive,
      });

      pageLoadingTokenRef.current = token;
      return token;
    },
    [setIsPageLoading]
  );

  const stopPageLoading = useCallback(
    (token = pageLoadingTokenRef.current) => {
      if (token === null) return;

      setIsPageLoading(false, undefined, token);

      if (pageLoadingTokenRef.current === token) {
        pageLoadingTokenRef.current = null;
      }
    },
    [setIsPageLoading]
  );

  useEffect(() => {
    if (loading) {
      startPageLoading(view, resolvedAmbassadorMode);
    } else {
      stopPageLoading();
    }
  }, [
    loading,
    view,
    resolvedAmbassadorMode,
    startPageLoading,
    stopPageLoading,
  ]);

  useEffect(() => {
    return () => {
      stopPageLoading();
    };
  }, [stopPageLoading]);

  const fetchUnreadCounts = useCallback(async () => {
    if (!profile?.id) return;

    if (!isAmbassadorActive) {
      try {
        const { data: recipients } = await supabase
          .from('notification_recipients')
          .select('notification_id')
          .eq('user_id', profile.id)
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
            .in('target_audience', ['CUSTOMER', 'ALL', 'SPECIFIC']);

          setUnreadNotifCount(count || 0);
        } else {
          setUnreadNotifCount(0);
        }
      } catch (err) {
        console.error('Error fetching unread notification count:', err);
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
          .eq('channel_id', profile.id)
          .eq('is_read', false)
          .neq('sender_role', 'ambassador');

        setUnreadMessagesCount(count || 0);
      } catch (err) {
        console.error('Error fetching unread messages count:', err);
      }
    }
  }, [profile?.id, isAmbassadorActive]);

  useEffect(() => {
    if (!profile?.id) return;

    fetchUnreadCounts();

    const notifChannel = supabase
      .channel(`profile_notif_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${profile.id}`,
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    const chatChannel = supabase
      .channel(`profile_chat_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications',
          filter: `channel_id=eq.${profile.id}`,
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [profile?.id, fetchUnreadCounts]);

  const avatar = useProfileAvatar({
    profile,
    setProfile,
    avatarUrl,
    setAvatarUrl,
  });

  const fetchUserData = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setSession({ user });

      const cleanEmail = (user.email || '').toLowerCase();
      const userInviteToken = user.user_metadata?.invite_token;

      let pendingInvite: any = null;

      if (userInviteToken) {
        const { data: inviteByToken } = await supabase
          .from('ambassador')
          .select('*')
          .eq('token', userInviteToken)
          .eq('is_registered', false)
          .maybeSingle();

        pendingInvite = inviteByToken;
      }

      if (!pendingInvite && cleanEmail) {
        const { data: inviteByEmail } = await supabase
          .from('ambassador')
          .select('*')
          .or(`email.eq.${cleanEmail},recipient_identifier.eq.${cleanEmail}`)
          .eq('is_registered', false)
          .maybeSingle();

        pendingInvite = inviteByEmail;
      }

      if (pendingInvite) {
        await supabase.rpc('complete_ambassador_registration', {
          invite_token: pendingInvite.token,
          new_user_id: user.id,
          user_email: cleanEmail,
          user_name:
            user.user_metadata?.full_name ||
            pendingInvite.display_name ||
            '',
        });
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const normalizedRole = prof?.role
        ? String(prof.role).toUpperCase().trim()
        : '';

      const isStaff = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(
        normalizedRole
      );

      if (isStaff) {
        navigate('/admin', { replace: true });
        return;
      }

      const fetchedAvatar = prof?.avatar_url || null;

      setProfile({
        ...prof,
        email: user.email,
        avatar_url: fetchedAvatar,
      });

      setAvatarUrl(fetchedAvatar);

      if (normalizedRole === 'AMBASSADOR') {
        const { data: amb } = await supabase
          .from('ambassador')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setAmbassadorData(amb);

        if (amb) {
          setCurrentSlug(amb.assigned_slug || '');
          setCurrentPayoutDetails(amb.payout_details || '');

          if (amb.payout_details && amb.payout_details.includes(':')) {
            const [method] = amb.payout_details.split(':');

            if (method?.trim()) {
              setPayoutMethod(method.trim());
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const settings = useProfileSettings({
    profile,
    isAmbassador,
    currentSlug,
    payoutMethod,
    resetFormFields: () => {},
    fetchUserData,
  });

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const changeView = (newView: ProfileViewType) => {
    setView(newView);
    localStorage.setItem('currentView', newView);
    settings.setSettingsFeedback(null);
    settings.setFieldErrors({});

    if (loading) {
      startPageLoading(newView, resolvedAmbassadorMode);
    }
  };

  const togglePortalMode = () => {
    if (!isAmbassador) {
      return;
    }

    const nextMode: PortalModeType =
      portalMode === 'customer' ? 'ambassador' : 'customer';

    setPortalMode(nextMode);
    localStorage.setItem('portalMode', nextMode);

    const token = startPageLoading(view, nextMode === 'ambassador');

    window.requestAnimationFrame(() => {
      stopPageLoading(token);
    });
  };

  return {
    view,
    portalMode,
    isDetailsSheetOpen,
    setIsDetailsSheetOpen,
    profile,
    ambassadorData,
    loading,
    unreadNotifCount,
    unreadMessagesCount,
    currentSlug,
    payoutMethod,
    setPayoutMethod,
    currentPayoutDetails,
    avatarUrl,
    isAmbassador,
    isAmbassadorActive,
    changeView,
    fetchUnreadCounts,
    togglePortalMode,
    ...avatar,
    ...settings,
  };
}
