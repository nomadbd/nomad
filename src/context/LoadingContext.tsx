import React, { createContext, useContext, useState, useCallback } from 'react';

export type SkeletonViewType =
  | 'home'
  | 'orders'
  | 'ambassador'
  | 'settings'
  | 'communication'
  | 'notifications'
  | 'chat'
  | 'password'
  | null;

interface LoadingOptions {
  view?: SkeletonViewType;
  isAmbassador?: boolean;
}

interface LoadingContextType {
  isPageLoading: boolean;
  skeletonView: SkeletonViewType;
  isAmbassadorSkeleton: boolean;
  setIsPageLoading: (loading: boolean, options?: LoadingOptions) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isPageLoading: false,
  skeletonView: null,
  isAmbassadorSkeleton: false,
  setIsPageLoading: () => {},
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPageLoading, setIsLoadingState] = useState(false);
  const [skeletonView, setSkeletonView] = useState<SkeletonViewType>(null);
  const [isAmbassadorSkeleton, setIsAmbassadorSkeleton] = useState(false);

  const setIsPageLoading = useCallback((loading: boolean, options?: LoadingOptions) => {
    setIsLoadingState(loading);
    if (loading) {
      if (options?.view !== undefined) {
        setSkeletonView(options.view);
      }
      if (options?.isAmbassador !== undefined) {
        setIsAmbassadorSkeleton(options.isAmbassador);
      }
    } else {
      setSkeletonView(null);
      setIsAmbassadorSkeleton(false);
    }
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isPageLoading,
        skeletonView,
        isAmbassadorSkeleton,
        setIsPageLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = () => useContext(LoadingContext);
