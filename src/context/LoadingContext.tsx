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

interface LoadingContextState {
  isPageLoading: boolean;
  skeletonView: SkeletonViewType;
  isAmbassadorSkeleton: boolean;
}

interface LoadingContextType extends LoadingContextState {
  setIsPageLoading: (
    loading: boolean,
    options?: LoadingOptions,
    sourceId?: number
  ) => number;
}

const initialLoadingState: LoadingContextState = {
  isPageLoading: false,
  skeletonView: null,
  isAmbassadorSkeleton: false,
};

const LoadingContext = createContext<LoadingContextType>({
  ...initialLoadingState,
  setIsPageLoading: () => 0,
});

export const LoadingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [loadingState, setLoadingState] =
    useState<LoadingContextState>(initialLoadingState);

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

        // Loading ও skeleton mode একই state update-এ বদলায়।
        setLoadingState({
          isPageLoading: true,
          skeletonView: options?.view ?? null,
          isAmbassadorSkeleton: Boolean(options?.isAmbassador),
        });

        return nextToken;
      }

      // পুরোনো loading request-এর completion নতুন request বন্ধ করতে পারবে না।
      if (
        typeof sourceId === 'number' &&
        sourceId !== activeTokenRef.current
      ) {
        return activeTokenRef.current;
      }

      const nextToken = activeTokenRef.current + 1;
      activeTokenRef.current = nextToken;

      setLoadingState(initialLoadingState);

      return nextToken;
    },
    []
  );

  return (
    <LoadingContext.Provider
      value={{
        ...loadingState,
        setIsPageLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = () =>
  useContext(LoadingContext);