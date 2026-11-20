import React, { useEffect, useState } from 'react';
import {
  isPushSupported,
  getCurrentPushSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from './pushManager';

interface ProfileSettingsProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      display_name?: string;
      store_slug?: string;
      payout_method?: string;
      payout_number?: string;
    };
  };
  onClose: () => void;
  onSave?: (updatedData: {
    displayName: string;
    storeSlug: string;
    payoutMethod: string;
    payoutNumber: string;
  }) => Promise<void> | void;
  onChangePassword?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
}

const AnimatedDots: React.FC = () => {
  return (
    <span className="inline-flex items-center justify-center gap-[3px]" aria-label="Loading">
      <span className="w-[4px] h-[4px] rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <span className="w-[4px] h-[4px] rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <span className="w-[4px] h-[4px] rounded-full bg-current animate-bounce" />
    </span>
  );
};

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  onClose,
  onSave,
  onChangePassword,
  onSignOut,
  onDeleteAccount,
}) => {
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || 'Kawsar'
  );
  const [storeSlug, setStoreSlug] = useState(
    user?.user_metadata?.store_slug || 'kawsarahmed'
  );
  const [payoutMethod, setPayoutMethod] = useState(
    user?.user_metadata?.payout_method || 'bKash'
  );
  const [payoutNumber, setPayoutNumber] = useState(
    user?.user_metadata?.payout_number || '017XXXXXXXX'
  );

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [pushSupported, setPushSupported] = useState<boolean>(true);
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(false);
  const [isPushLoading, setIsPushLoading] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkPushState = async () => {
      const supported = isPushSupported();
      if (!isMounted) return;
      setPushSupported(supported);

      if (!supported) {
        setIsPushEnabled(false);
        return;
      }

      try {
        const sub = await getCurrentPushSubscription();
        if (!isMounted) return;
        const hasPermission =
          typeof Notification !== 'undefined' && Notification.permission === 'granted';
        setIsPushEnabled(Boolean(sub && hasPermission));
      } catch {
        if (!isMounted) return;
        setIsPushEnabled(false);
      }
    };

    checkPushState();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleTogglePushAlerts = async () => {
    if (isPushLoading) return;

    setIsPushLoading(true);
    setPushStatus(null);

    try {
      if (isPushEnabled) {
        const result = await unsubscribeUserFromPush(user.id);
        if (result.ok) {
          setIsPushEnabled(false);
          setPushStatus({
            type: 'error',
            text: result.message || 'Real-time sales alerts disabled.',
          });
        } else {
          setPushStatus({
            type: 'error',
            text: result.message || 'Could not disable sales alerts.',
          });
        }
      } else {
        const result = await subscribeUserToPush(user.id);
        if (result.ok) {
          setIsPushEnabled(true);
          setPushStatus({
            type: 'success',
            text: result.message || 'Real-time sales alerts enabled.',
          });
        } else {
          setIsPushEnabled(false);
          setPushStatus({
            type: 'error',
            text: result.message || 'Could not enable sales alerts.',
          });
        }
      }
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Unexpected error while updating alerts.';
      setPushStatus({
        type: 'error',
        text: errMsg,
      });
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave || isSavingProfile) return;

    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      await onSave({
        displayName,
        storeSlug,
        payoutMethod,
        payoutNumber,
      });
      setProfileMessage({
        type: 'success',
        text: 'Settings saved.',
      });
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const payoutMethods = ['bKash', 'Nagad', 'Rocket'];

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-y-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-semibold tracking-[0.2em] uppercase text-white">
          SETTINGS
        </h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="text-white/80 hover:text-white text-2xl leading-none px-1 py-0.5 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6 max-w-md mx-auto">
        {/* Email Address */}
        <div>
          <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400 mb-2">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-md px-3.5 py-3 text-sm text-neutral-300 focus:outline-none"
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400 mb-2">
            DISPLAY NAME
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-md px-3.5 py-3 text-sm text-white focus:outline-none focus:border-neutral-600"
          />
        </div>

        {/* Store Slug */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400">
              STORE SLUG
            </label>
            <span className="text-xs text-neutral-500">/{storeSlug}</span>
          </div>
          <input
            type="text"
            value={storeSlug}
            onChange={(e) => setStoreSlug(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-md px-3.5 py-3 text-sm text-white focus:outline-none focus:border-neutral-600"
          />
        </div>

        {/* Default Payout Method */}
        <div>
          <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400 mb-3">
            DEFAULT PAYOUT METHOD
          </label>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {payoutMethods.map((method) => {
              const active = payoutMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayoutMethod(method)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'border-white text-white bg-neutral-900'
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="mr-1.5">{active ? '●' : '○'}</span>
                  {method}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payout Number */}
        <div>
          <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400 mb-2">
            PAYOUT NUMBER
          </label>
          <input
            type="text"
            value={payoutNumber}
            onChange={(e) => setPayoutNumber(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-md px-3.5 py-3 text-sm text-white focus:outline-none focus:border-neutral-600"
          />
        </div>

        {/* Real-Time Sales Alerts */}
        <div>
          <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400 mb-2">
            REAL-TIME SALES ALERTS
          </label>

          <div className="bg-[#0b0b0b] border border-neutral-800 rounded-xl px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Sales &amp; admin alerts</p>
              </div>

              <button
                type="button"
                disabled={isPushLoading || !pushSupported}
                onClick={handleTogglePushAlerts}
                className={`min-w-[84px] h-[30px] px-3.5 rounded-md text-[11px] font-semibold tracking-[0.12em] uppercase inline-flex items-center justify-center shrink-0 transition-colors ${
                  !pushSupported
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : isPushLoading
                    ? 'bg-neutral-700 text-neutral-200 cursor-wait'
                    : isPushEnabled
                    ? 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 cursor-pointer'
                    : 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
                }`}
              >
                {isPushLoading ? (
                  <AnimatedDots />
                ) : !pushSupported ? (
                  'UNSUPPORTED'
                ) : isPushEnabled ? (
                  'DISABLE'
                ) : (
                  'ENABLE'
                )}
              </button>
            </div>

            {!pushSupported && (
              <p className="mt-2.5 text-xs text-red-400">
                Push notifications are not supported in this browser.
              </p>
            )}

            {pushStatus && (
              <p
                className={`mt-2.5 text-xs ${
                  pushStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {pushStatus.text}
              </p>
            )}
          </div>
        </div>

        {profileMessage && (
          <p
            className={`text-xs ${
              profileMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {profileMessage.text}
          </p>
        )}

        {onSave && (
          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full py-2.5 rounded-md border border-neutral-700 text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            {isSavingProfile ? <AnimatedDots /> : 'SAVE CHANGES'}
          </button>
        )}

        {/* Footer Actions */}
        <div className="pt-4 space-y-5">
          <button
            type="button"
            onClick={onChangePassword}
            className="w-full flex items-center justify-between text-left text-xs font-medium tracking-[0.16em] uppercase text-neutral-300 hover:text-white py-1 cursor-pointer"
          >
            <span>CHANGE PASSWORD</span>
            <span className="text-neutral-500 text-base">›</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="block text-left text-xs font-medium tracking-[0.16em] uppercase text-neutral-300 hover:text-white py-1 cursor-pointer"
          >
            SIGN OUT
          </button>

          <button
            type="button"
            onClick={onDeleteAccount}
            className="block text-left text-xs font-medium tracking-[0.16em] uppercase text-red-500 hover:text-red-400 py-1 cursor-pointer"
          >
            DELETE ACCOUNT
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
