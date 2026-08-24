export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  return data.secure_url;
};

const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    let publicIdParts = parts.slice(uploadIndex + 1);
    if (publicIdParts[0] && publicIdParts[0].startsWith('v')) {
      publicIdParts = publicIdParts.slice(1);
    }

    const fullPath = publicIdParts.join('/');
    return fullPath.substring(0, fullPath.lastIndexOf('.')) || fullPath;
  } catch {
    return null;
  }
};

export const deleteFromCloudinary = async (mediaUrl: string): Promise<any> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const publicId = getPublicIdFromUrl(mediaUrl);

  if (!publicId) return;

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: 'POST', body: formData }
    );
    return await response.json();
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};
