import { useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '../../cloudinary';
import { FeedbackState, stripQueryParams } from './profileTypes';

interface UseProfileAvatarParams {
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  avatarUrl: string | null;
  setAvatarUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useProfileAvatar({
  profile,
  setProfile,
  avatarUrl,
  setAvatarUrl,
}: UseProfileAvatarParams) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<FeedbackState | null>(
    null
  );
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(
    null
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarFeedback(null);

    const reader = new FileReader();

    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
    };

    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const handleApplyCropAndUpload = async (croppedFile: File) => {
    if (!profile?.id) {
      setAvatarFeedback({
        type: 'error',
        text: 'User profile ID missing.',
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      setCropModalOpen(false);
      setAvatarFeedback(null);

      if (avatarUrl) {
        await deleteFromCloudinary(stripQueryParams(avatarUrl));
      }

      const uniquePublicId = `${profile.id}_${Date.now()}`;

      const uploadedUrl = await uploadToCloudinary(
        croppedFile,
        'avatars',
        uniquePublicId
      );

      if (!uploadedUrl) {
        setAvatarFeedback({
          type: 'error',
          text: 'Image upload failed. Please try again.',
        });
        return;
      }

      const cleanUploadedUrl = stripQueryParams(uploadedUrl);
      const urlWithCacheBust = `${cleanUploadedUrl}?v=${Date.now()}`;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          avatar_url: urlWithCacheBust,
        })
        .eq('id', profile.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        setAvatarFeedback({
          type: 'error',
          text: 'Database permission denied or row not found.',
        });
        return;
      }

      setAvatarUrl(urlWithCacheBust);

      setProfile((previous: any) => ({
        ...previous,
        avatar_url: urlWithCacheBust,
      }));

      setAvatarFeedback({
        type: 'success',
        text: 'Profile picture updated.',
      });
    } catch (err: any) {
      setAvatarFeedback({
        type: 'error',
        text: err?.message || 'Failed to upload profile picture.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.id) return;

    try {
      setUploadingAvatar(true);
      setAvatarFeedback(null);

      const currentUrl = avatarUrl || profile?.avatar_url;

      if (currentUrl) {
        await deleteFromCloudinary(stripQueryParams(currentUrl));
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
        })
        .eq('id', profile.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        setAvatarFeedback({
          type: 'error',
          text: 'Could not remove profile picture.',
        });
        return;
      }

      setAvatarUrl(null);

      setProfile((previous: any) => ({
        ...previous,
        avatar_url: null,
      }));

      setAvatarFeedback({
        type: 'success',
        text: 'Profile picture removed.',
      });
    } catch (err: any) {
      setAvatarFeedback({
        type: 'error',
        text: err?.message || 'Failed to remove profile picture.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return {
    fileInputRef,
    uploadingAvatar,
    avatarFeedback,
    setAvatarFeedback,
    cropModalOpen,
    setCropModalOpen,
    selectedImageSrc,
    handleFileSelect,
    handleApplyCropAndUpload,
    handleDeleteAvatar,
  };
}
