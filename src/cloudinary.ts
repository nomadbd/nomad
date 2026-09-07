export const uploadToCloudinary = async (
  file: File,
  folder?: string,
  publicId?: string
): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME বা VITE_CLOUDINARY_UPLOAD_PRESET সেট করা নেই।');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  if (folder) {
    formData.append('folder', folder);
  }

  // দ্রষ্টব্য: Cloudinary Unsigned preset-এ public_id পাঠালে Cloudinary Settings-এ 
  // "Use filename or specified public id" অপশনটি অন থাকতে হবে।
  if (publicId) {
    formData.append('public_id', publicId);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();

  if (!response.ok) {
    // Cloudinary থেকে যে আসল এরর আসছে তা স্ক্রিনে দেখাবে
    throw new Error(data.error?.message || 'Cloudinary upload failed.');
  }

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
  // ফ্রন্টএন্ড (Unsigned) থেকে সরাসরি ফাইল ডিলিট করা ক্লাউডিনারি এলাউ করে না।
  console.warn('Unsigned preset দিয়ে ক্লায়েন্ট সাইড থেকে ফাইল ডিলিট করা সম্ভব নয়।');
  return null;
};
