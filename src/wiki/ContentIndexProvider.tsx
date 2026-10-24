/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchContentIndex } from '../core/repository';
import type { ContentIndex } from '../core/types';

const EMPTY_INDEX: ContentIndex = {
  spec: 'pcl2wiki-index/1',
  packages: [],
  articles: [],
};

interface ContentIndexState {
  index: ContentIndex;
  loading: boolean;
  reload: () => Promise<void>;
}

const ContentIndexContext = createContext<ContentIndexState>({
  index: EMPTY_INDEX,
  loading: true,
  reload: async () => undefined,
});

export function ContentIndexProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<ContentIndex>(EMPTY_INDEX);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const next = await fetchContentIndex();
    setIndex(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <ContentIndexContext.Provider value={{ index, loading, reload }}>
      {children}
    </ContentIndexContext.Provider>
  );
}

export function useContentIndex(): ContentIndexState {
  return useContext(ContentIndexContext);
}

