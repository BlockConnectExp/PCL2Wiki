import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ArticlePage } from './wiki/ArticlePage';
import { ContentIndexProvider } from './wiki/ContentIndexProvider';
import { HomePage } from './wiki/HomePage';
import { NotFoundPage } from './wiki/NotFoundPage';
import { WikiLayout } from './wiki/WikiLayout';

const EditorPage = lazy(() =>
  import('./editor/EditorPage').then((module) => ({ default: module.EditorPage })),
);

export default function App() {
  return (
    <HashRouter>
      <ContentIndexProvider>
        <Routes>
          <Route element={<WikiLayout />}>
            <Route index element={<HomePage />} />
            <Route path="wiki/:slug" element={<ArticlePage />} />
          </Route>
          <Route
            path="editor"
            element={
              <Suspense fallback={<p className="page-note">加载中…</p>}>
                <EditorPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ContentIndexProvider>
    </HashRouter>
  );
}

