import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

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

export interface LoadingOptions {
  view?: SkeletonViewType;
  isAmbassador?: boolean;
}

interface LoadingContextType {
  isPageLoading: boolean;
  skeletonView: SkeletonViewType;
  isAmbassadorSkeleton: boolean;
  setIsPageLoading: (
    loading: boolean,
    options?: LoadingOptions,
    sourceId?: number
  ) => number;
}

const LoadingContext = createContext<LoadingContextType>({
  isPageLoading: false,
  skeletonView: null,
  isAmbassadorSkeleton: false,
  setIsPageLoading: () => 0,
});

export const LoadingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isPageLoading, setIsLoadingState] = useState(false);
  const [skeletonView, setSkeletonView] = useState<SkeletonViewType>(null);
  const [isAmbassadorSkeleton, setIsAmbassadorSkeleton] =
    useState(false);

  const activeTokenRef = useRef(0);

  const setIsPageLoading = useCallback(
    (
      loading: boolean,
      options?: LoadingOptions,
      sourceId?: number
    ): number => {
      if (loading) {
        const nextToken = activeTokenRef.current + 1;
        activeTokenRef.current = nextToken;

        setIsLoadingState(true);
        setSkeletonView(options?.view ?? null);
        setIsAmbassadorSkeleton(
          Boolean(options?.isAmbassador)
        );

        return nextToken;
      }

      if (
        typeof sourceId === 'number' &&
        sourceId !== activeTokenRef.current
      ) {
        return activeTokenRef.current;
      }

      activeTokenRef.current += 1;
      setIsLoadingState(false);
      setSkeletonView(null);
      setIsAmbassadorSkeleton(false);

      return activeTokenRef.current;
    },
    []
  );

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

export const useGlobalLoading = () =>
  useContext(LoadingContext);