import { SkeletonViewType } from '../../context/LoadingContext';

export type ProfileViewType =
  | 'profile'
  | 'settings'
  | 'notifications'
  | 'communication';

export const stripQueryParams = (url: string) => url.split('?')[0];

export const resolveSkeletonViewForState = (
  targetView: ProfileViewType,
  targetAmbassadorActive: boolean
): SkeletonViewType => {
  if (targetView === 'settings') return 'settings';
  if (targetView === 'notifications') return 'notifications';
  if (targetView === 'communication') return 'communication';

  return targetAmbassadorActive ? 'ambassador' : 'orders';
};

export const getInitials = (
  name?: string,
  email?: string
) => {
  if (name?.trim()) {
    return name
      .trim()
      .split(' ')
      .map((item) => item[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  if (email?.trim()) {
    return email.trim()[0].toUpperCase();
  }

  return 'U';
};
