import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { FeedbackState, SettingsFieldErrors } from './profileTypes';

interface UseProfileSettingsParams {
  profile: any;
  isAmbassador: boolean;
  currentSlug: string;
  payoutMethod: string;
  resetFormFields: () => void;
  fetchUserData: () => Promise<void>;
}

export function useProfileSettings({
  profile,
  isAmbassador,
  currentSlug,
  payoutMethod,
  resetFormFields,
  fetchUserData,
}: UseProfileSettingsParams) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null
  );
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [newSlug, setNewSlug] = useState('');
  const [newPayoutNumber, setNewPayoutNumber] = useState('');

  const [settingsFeedback, setSettingsFeedback] =
    useState<FeedbackState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SettingsFieldErrors>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const resetSettingsForm = () => {
    setNewName('');
    setNewEmail('');
    setCurrentPassword('');
    setNewPassword('');
    setDeleteConfirmPassword('');
    setNewSlug('');
    setNewPayoutNumber('');
    resetFormFields();
  };

  const handleSignOut = async () => {
    localStorage.removeItem('currentView');
    localStorage.removeItem('portalMode');

    await supabase.auth.signOut();

    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountError(null);

    if (!deleteConfirmPassword) {
      setDeleteAccountError('Password is required to delete account.');
      return;
    }

    setDeletingAccount(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: deleteConfirmPassword,
      });

      if (authError) {
        setDeleteAccountError('Incorrect password. Account deletion failed.');
        setDeletingAccount(false);
        return;
      }

      const { error } = await supabase.rpc('delete_user');

      if (error) {
        setDeleteAccountError(error.message || 'Could not delete account.');
        setDeletingAccount(false);
      } else {
        setShowConfirm(false);

        localStorage.removeItem('currentView');
        localStorage.removeItem('portalMode');

        await supabase.auth.signOut();

        window.location.href = '/';
      }
    } catch (err: any) {
      setDeleteAccountError(
        err?.message || 'Unexpected error deleting account.'
      );
      setDeletingAccount(false);
    }
  };

  const handleUpdate = async () => {
    setSettingsFeedback(null);
    setFieldErrors({});

    try {
      let emailChanged = false;
      let otherChanges = false;
      let passwordChanged = false;

      if (newName.trim() && newName !== profile?.name) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: newName.trim(),
          })
          .eq('id', profile.id);

        if (error) throw error;
        otherChanges = true;
      }

      if (newEmail.trim() && newEmail !== profile?.email) {
        const { error } = await supabase.auth.updateUser({
          email: newEmail.trim(),
        });

        if (error) {
          setFieldErrors({
            email: error.message,
          });
          return;
        }

        emailChanged = true;
      }

      if (newPassword) {
        if (!currentPassword) {
          setFieldErrors({
            password: 'Current password is required to change password.',
          });
          return;
        }

        if (newPassword.length < 6) {
          setFieldErrors({
            password: 'New password must be at least 6 characters long.',
          });
          return;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: currentPassword,
        });

        if (authError) {
          setFieldErrors({
            password: 'Incorrect current password.',
          });
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          setFieldErrors({
            password: passwordError.message,
          });
          return;
        }

        passwordChanged = true;
        otherChanges = true;
      }

      if (isAmbassador && profile?.id) {
        const updatesToAmb: any = {};

        const getFallbackSlug = (name?: string) => {
          if (!name?.trim()) {
            return '';
          }

          return name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        };

        const targetSlug = newSlug.trim()
          ? newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
          : !currentSlug
            ? getFallbackSlug(profile?.name)
            : '';

        if (targetSlug && targetSlug !== currentSlug) {
          const { data: existing } = await supabase
            .from('ambassador')
            .select('id, user_id')
            .eq('assigned_slug', targetSlug)
            .neq('user_id', profile.id)
            .maybeSingle();

          if (existing) {
            setFieldErrors({
              slug: 'This URL slug is already taken.',
            });
            return;
          }

          updatesToAmb.assigned_slug = targetSlug;
        }

        if (newPayoutNumber.trim()) {
          updatesToAmb.payout_details = `${payoutMethod}: ${newPayoutNumber.trim()}`;
        }

        if (Object.keys(updatesToAmb).length > 0) {
          const { data: ambassadorUpdate, error: ambassadorError } =
            await supabase
              .from('ambassador')
              .update(updatesToAmb)
              .eq('user_id', profile.id)
              .select();

          if (ambassadorError) {
            throw ambassadorError;
          }

          if (!ambassadorUpdate || ambassadorUpdate.length === 0) {
            setSettingsFeedback({
              type: 'error',
              text: 'Update failed. Please check database permissions.',
            });
            return;
          }

          otherChanges = true;
        }
      }

      setCurrentPassword('');
      setNewPassword('');
      setDeleteConfirmPassword('');
      setNewSlug('');
      setNewPayoutNumber('');

      await fetchUserData();

      if (emailChanged) {
        setSettingsFeedback({
          type: 'success',
          text: 'Check your new email inbox to verify the change.',
        });
      } else if (passwordChanged) {
        setSettingsFeedback({
          type: 'success',
          text: 'Password updated successfully.',
        });
      } else if (otherChanges) {
        setSettingsFeedback({
          type: 'success',
          text: 'Settings updated successfully.',
        });
      }
    } catch (error: any) {
      setSettingsFeedback({
        type: 'error',
        text: error?.message || 'Failed to update settings.',
      });
    }
  };

  return {
    newName,
    setNewName,
    newEmail,
    setNewEmail,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    deleteConfirmPassword,
    setDeleteConfirmPassword,
    deleteAccountError,
    setDeleteAccountError,
    deletingAccount,
    newSlug,
    setNewSlug,
    newPayoutNumber,
    setNewPayoutNumber,
    settingsFeedback,
    setSettingsFeedback,
    fieldErrors,
    setFieldErrors,
    showConfirm,
    setShowConfirm,
    resetSettingsForm,
    handleSignOut,
    handleDeleteAccount,
    handleUpdate,
  };
}
