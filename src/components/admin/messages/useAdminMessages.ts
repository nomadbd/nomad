import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Thread, Message } from './types';

export const useAdminMessages = (
  searchQuery: string,
  propActiveThreadId: string | null,
  onSelectThread?: (id: string | null, thread?: Thread | null) => void
) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [internalActiveThreadId, setInternalActiveThreadId] = useState<string | null>(propActiveThreadId);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');

  useEffect(() => {
    setInternalActiveThreadId(propActiveThreadId);
  }, [propActiveThreadId]);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setAdminEmail(user.email.trim().toLowerCase());
      }
    };
    fetchCurrentAdmin();
  }, []);

  const activeThreadId =
    propActiveThreadId !== undefined && propActiveThreadId !== null ? propActiveThreadId : internalActiveThreadId;

  const markThreadAsRead = async (thread: Thread) => {
    setThreads((prevThreads) =>
      prevThreads.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
    );

    try {
      const query = thread.id === 'all_staff'
        ? supabase.from('communications').update({ is_read: true }).eq('channel_type', 'staff_group').eq('is_read', false)
        : supabase.from('communications').update({ is_read: true }).eq('channel_id', thread.id).eq('is_read', false);

      const { error } = await query;
      if (error) console.error('Failed to mark messages as read in DB:', error.message);
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const handleSelectThread = async (thread: Thread | null) => {
    const threadId = thread ? thread.id : null;
    setInternalActiveThreadId(threadId);

    if (thread && thread.unreadCount > 0) {
      markThreadAsRead(thread);
    }

    if (thread && adminEmail) {
      const unreadMsgs = thread.messages.filter((m) => {
        const readBy = Array.isArray(m.read_by) ? m.read_by : [];
        return !readBy.some((r) => r.user_email?.trim().toLowerCase() === adminEmail);
      });

      if (unreadMsgs.length > 0) {
        const msgIds = unreadMsgs.map((m) => m.id);
        const { data: commsData } = await supabase.from('communications').select('id, read_by').in('id', msgIds);
        if (commsData) {
          for (const comm of commsData) {
            const existingReadBy = Array.isArray(comm.read_by) ? comm.read_by : [];
            if (!existingReadBy.some((r: any) => r.user_email?.trim().toLowerCase() === adminEmail)) {
              const updatedReadBy = [...existingReadBy, { user_email: adminEmail, seen_at: new Date().toISOString() }];
              await supabase.from('communications').update({ read_by: updatedReadBy, is_read: true }).eq('id', comm.id);
            }
          }
        }
      }
    }

    if (onSelectThread) {
      onSelectThread(threadId, thread);
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchCommunicationsAndUsers = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setErrorMsg(null);

      const [authRes, commsRes, profilesRes, ambRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('communications').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('email, name, role, designation, avatar_url, created_at, status'),
        supabase.from('ambassador').select('email, recipient_identifier, phone, assigned_slug, token, display_name, invite_sent_at'),
      ]);

      const currentEmail = authRes.data.user?.email?.trim().toLowerCase() || adminEmail;
      if (currentEmail) setAdminEmail(currentEmail);

      if (commsRes.error) throw commsRes.error;

      // প্রোফাইল ম্যাপিং: ইমেল এবং নাম/স্লাগ উভয় দিয়েই ইনডেক্স করা হলো যাতে কেউ বাদ না পড়ে
      const profileMap: Record<string, { email: string; name: string; role: string; designation?: string; avatarUrl: string; createdAt?: string }> = {};
      const profileMapByName: Record<string, { email: string; name: string; role: string; designation?: string; avatarUrl: string; createdAt?: string }> = {};

      if (profilesRes.data) {
        profilesRes.data.forEach((p: any) => {
          const profileObj = {
            email: p.email ? p.email.trim().toLowerCase() : '',
            name: p.name || '',
            role: (p.role || 'CUSTOMER').toUpperCase(),
            designation: p.designation || '',
            avatarUrl: p.avatar_url && p.avatar_url !== 'NULL' ? String(p.avatar_url).trim() : '',
            createdAt: p.created_at || '',
          };

          if (profileObj.email) {
            profileMap[profileObj.email] = profileObj;
          }
          if (profileObj.name) {
            const cleanNameKey = profileObj.name.trim().toLowerCase();
            profileMapByName[cleanNameKey] = profileObj;
            // নামের প্রথম অংশ দিয়েও কিউ বসালাম (যেমন 'liton', 'imran')
            const firstNameKey = cleanNameKey.split(' ')[0];
            if (firstNameKey) {
              profileMapByName[firstNameKey] = profileObj;
            }
          }
        });
      }

      const ambassadorMap: Record<string, { displayName: string; identifier: string; phone?: string; inviteSentAt?: string; email?: string; token?: string }> = {};
      if (ambRes.data) {
        ambRes.data.forEach((a: any) => {
          const ambDataObj = {
            displayName: a.display_name || '',
            identifier: a.recipient_identifier || a.email || a.assigned_slug || a.token || '',
            phone: a.phone || '',
            inviteSentAt: a.invite_sent_at || '',
            email: a.email ? a.email.trim().toLowerCase() : '',
            token: a.token || a.assigned_slug || '',
          };

          const possibleKeys = [a.email, a.recipient_identifier, a.assigned_slug, a.token, a.phone];
          possibleKeys.forEach((key) => {
            if (key && typeof key === 'string') {
              const cleanKey = key.trim().toLowerCase();
              if (cleanKey) ambassadorMap[cleanKey] = ambDataObj;
            }
          });
        });
      }

      const threadMap: { [key: string]: Thread } = {
        all_staff: {
          id: 'all_staff',
          userName: 'Management Team',
          userEmail: '',
          userPhone: '',
          role: 'GROUP',
          designation: '',
          avatarUrl: '',
          createdAt: '',
          inviteSentAt: '',
          unreadCount: 0,
          lastMessage: 'Core management workspace',
          lastMessageTime: new Date().toISOString(),
          messages: [],
        },
      };

      if (commsRes.data) {
        commsRes.data.forEach((item: any) => {
          const itemSenderEmail = (item.sender_email || '').trim().toLowerCase();
          const isMyOwnMessage = itemSenderEmail === currentEmail;
          const isGroupMsg = item.channel_type === 'staff_group' || item.channel_id === 'all_staff';

          const senderProfile = itemSenderEmail ? profileMap[itemSenderEmail] : null;

          const rawCreatedAt = item.created_at || new Date().toISOString();
          const formattedTime = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          if (isGroupMsg) {
            threadMap['all_staff'].messages.push({
              id: item.id || String(Math.random()),
              sender: isMyOwnMessage ? 'ADMIN' : 'USER',
              senderEmail: itemSenderEmail,
              senderName: senderProfile?.name || item.sender_name || (isMyOwnMessage ? 'You' : 'Staff Member'),
              senderDesignation: senderProfile?.designation || item.sender_designation || '',
              text: item.message || '',
              timestamp: formattedTime,
              read_by: Array.isArray(item.read_by) ? item.read_by : [],
            });

            if (item.is_read === false && !isMyOwnMessage) {
              threadMap['all_staff'].unreadCount += 1;
            }

            threadMap['all_staff'].lastMessage = item.message || '';
            threadMap['all_staff'].lastMessageTime = rawCreatedAt;
            return;
          }

          let rawEmail = isMyOwnMessage ? item.recipient_email : item.sender_email;
          if (rawEmail === 'EMPTY' || !rawEmail) rawEmail = '';

          const channelId = (item.channel_id || '').trim().toLowerCase();
          const ambData = (channelId ? ambassadorMap[channelId] : null) || (rawEmail ? ambassadorMap[rawEmail.trim().toLowerCase()] : null);

          const effectiveEmail = (rawEmail || ambData?.email || '').trim().toLowerCase();
          
          // অত্যন্ত সুরক্ষিত প্রোফাইল ডেটা খোঁজার লজিক (ইমেল অথবা চ্যানেল আইডি/নাম দিয়ে)
          const profileData = 
            (effectiveEmail ? profileMap[effectiveEmail] : null) || 
            (channelId ? profileMapByName[channelId] : null) || 
            (item.sender_name ? profileMapByName[item.sender_name.trim().toLowerCase()] : null);

          const threadId = channelId || (effectiveEmail ? effectiveEmail : 'general');
          const userEmail = effectiveEmail || profileData?.email || '';

          const displayName = ambData?.displayName || profileData?.name || userEmail || ambData?.phone || channelId || 'Guest';
          const userRole = profileData ? profileData.role : (ambData ? 'INVITED AMBASSADOR' : 'GUEST');
          const userDesignation = profileData?.designation || '';
          const userPhone = ambData?.phone || '';

          // সুনির্দিষ্টভাবে প্রতিটি থ্রেডের নিজস্ব অবতার অ্যাসাইন করা (অন্য কারো ছবি যেন না আসে)
          const userAvatar = profileData?.avatarUrl ? profileData.avatarUrl : '';

          if (!threadMap[threadId]) {
            threadMap[threadId] = {
              id: threadId,
              userName: displayName,
              userEmail: userEmail,
              userPhone: userPhone,
              role: userRole,
              designation: userDesignation,
              avatarUrl: userAvatar,
              createdAt: profileData?.createdAt || '',
              inviteSentAt: ambData?.inviteSentAt || '',
              unreadCount: item.is_read === false && !isMyOwnMessage ? 1 : 0,
              lastMessage: item.message || '',
              lastMessageTime: rawCreatedAt,
              messages: [],
            };
          } else {
            if (item.is_read === false && !isMyOwnMessage) {
              threadMap[threadId].unreadCount += 1;
            }
            if (!threadMap[threadId].avatarUrl && userAvatar) {
              threadMap[threadId].avatarUrl = userAvatar;
            }
            if (!threadMap[threadId].designation && userDesignation) {
              threadMap[threadId].designation = userDesignation;
            }
            if (displayName && displayName !== threadId && threadMap[threadId].userName === threadId) {
              threadMap[threadId].userName = displayName;
            }
          }

          threadMap[threadId].messages.push({
            id: item.id || String(Math.random()),
            sender: isMyOwnMessage ? 'ADMIN' : 'USER',
            senderEmail: itemSenderEmail,
            senderName: profileData?.name || displayName,
            senderDesignation: userDesignation,
            text: item.message || '',
            timestamp: formattedTime,
            read_by: Array.isArray(item.read_by) ? item.read_by : [],
          });

          threadMap[threadId].lastMessage = item.message || '';
          threadMap[threadId].lastMessageTime = rawCreatedAt;
        });

        const updatedThreads = Object.values(threadMap).sort((a, b) => {
          const timeA = new Date(a.lastMessageTime).getTime();
          const timeB = new Date(b.lastMessageTime).getTime();
          return timeB - timeA;
        });

        setThreads(updatedThreads);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'FAILED TO LOAD COMMUNICATIONS');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunicationsAndUsers(false);

    const channel = supabase
      .channel('public:communications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new;
            const senderEmail = (newMsg.sender_email || '').trim().toLowerCase();
            const myEmail = adminEmail.trim().toLowerCase();

            setThreads((prevThreads) => {
              return prevThreads.map((t) => {
                const isTargetThread =
                  (newMsg.channel_type === 'staff_group' && t.id === 'all_staff') ||
                  t.id === newMsg.channel_id ||
                  (t.userEmail && t.userEmail.toLowerCase() === senderEmail);

                if (isTargetThread) {
                  const isMyMsg = senderEmail === myEmail;
                  const isCurrentlyOpen = internalActiveThreadId === t.id;

                  return {
                    ...t,
                    lastMessage: newMsg.message || '',
                    lastMessageTime: newMsg.created_at || new Date().toISOString(),
                    unreadCount: (!isMyMsg && !isCurrentlyOpen) ? t.unreadCount + 1 : t.unreadCount,
                    messages: [
                      ...t.messages,
                      {
                        id: newMsg.id || String(Date.now()),
                        sender: isMyMsg ? 'ADMIN' : 'USER',
                        senderEmail: senderEmail,
                        text: newMsg.message || '',
                        timestamp: new Date(newMsg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        read_by: newMsg.read_by || [],
                      },
                    ],
                  };
                }
                return t;
              }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
            });
          } else {
            fetchCommunicationsAndUsers(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminEmail, internalActiveThreadId]);

  const filteredThreads = threads.filter((t) => {
    if (t.id === 'all_staff') return true;

    const threadRole = (t.role || '').toUpperCase();
    const filterRole = (roleFilter || 'ALL').toUpperCase();

    let matchesRole = false;
    if (filterRole === 'ALL') {
      matchesRole = true;
    } else if (filterRole === 'INVITED') {
      matchesRole = threadRole.includes('INVITED');
    } else {
      matchesRole = threadRole === filterRole;
    }

    const query = searchQuery.trim().toLowerCase();
    const userName = (t.userName || '').toLowerCase();
    const userEmail = (t.userEmail || '').toLowerCase();
    const userPhone = (t.userPhone || '').toLowerCase();
    val lastMsg = (t.lastMessage || '').toLowerCase();

    const matchesSearch =
      !query ||
      userName.includes(query) ||
      userEmail.includes(query) ||
      userPhone.includes(query) ||
      lastMsg.includes(query);

    return matchesRole && matchesSearch;
  });

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const handleSendMessage = async (e?: React.FormEvent, textareaRef?: React.RefObject<HTMLTextAreaElement>) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const messageText = inputText.trim();
    const nowIso = new Date().toISOString();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = String(Date.now());

    const newMsg: Message = {
      id: tempId,
      sender: 'ADMIN',
      senderEmail: adminEmail,
      text: messageText,
      timestamp: nowTime,
      read_by: [],
    };

    setThreads((prevThreads) => {
      const updated = prevThreads.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            lastMessage: messageText,
            lastMessageTime: nowIso,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      });

      return updated.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    });

    setInputText('');
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const isGroup = activeThread.id === 'all_staff';

      const payload = isGroup
        ? {
            sender_email: adminEmail || 'admin@nomadbd.com',
            sender_role: 'admin',
            recipient_email: null,
            message: messageText,
            channel_type: 'staff_group',
            channel_id: 'all_staff',
            is_read: false,
            read_by: [],
          }
        : {
            sender_email: adminEmail || 'admin@nomadbd.com',
            sender_role: 'admin',
            recipient_email: activeThread.userEmail || null,
            message: messageText,
            channel_type: (activeThread.role || '').toLowerCase(),
            channel_id: activeThread.id,
            is_read: false,
            read_by: [],
          };

      const { error } = await supabase.from('communications').insert([payload]);

      if (error) {
        console.error('Send error:', error.message);
        fetchCommunicationsAndUsers(true);
      }
    } catch (err: any) {
      console.error('Send error:', err);
    }
  };

  return {
    threads,
    activeThreadId,
    activeThread,
    filteredThreads,
    roleFilter,
    setRoleFilter,
    inputText,
    setInputText,
    loading,
    errorMsg,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleSelectThread,
    handleSendMessage,
    fetchCommunicationsAndUsers,
    adminEmail,
  };
};
