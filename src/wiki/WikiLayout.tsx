import { BookOpen, Moon, Package, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SITE } from '../config/site';
import { useContentIndex } from './ContentIndexProvider';

type ThemeMode = 'auto' | 'light' | 'dark';

function applyTheme(mode: ThemeMode) {
  if (mode === 'auto') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = mode;
  }
}

export function WikiLayout() {
  const { index } = useContentIndex();
  const location = useLocation();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pcl2wiki-theme') as ThemeMode | null) ?? 'auto';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('pcl2wiki-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme((current) => (current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto'));
  };

  const packages = index.packages.map((pkg) => ({
    ...pkg,
    articles: index.articles.filter((article) => article.packageId === pkg.id),
  }));

  return (
    <div className="wiki-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <BookOpen size={18} aria-hidden="true" />
          <span>{SITE.name}</span>
        </Link>
        <nav className="topbar-nav" aria-label="主导航">
          <Link to="/">首页</Link>
          <a href={`https://github.com/${SITE.repo}`} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </nav>
        <button className="icon-button" type="button" onClick={cycleTheme} title={`主题：${theme}`}>
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          <span className="sr-only">切换主题</span>
        </button>
      </header>

      <div className="wiki-body">
        <aside className="sidebar" aria-label="内容导航">
          {packages.length === 0 ? (
            <p className="sidebar-empty">暂无内容包</p>
          ) : (
            packages.map((pkg) => (
              <section key={pkg.id} className="sidebar-group">
                <h2>
                  <Package size={12} aria-hidden="true" />
                  {pkg.title}
                </h2>
                <ul>
                  {pkg.articles.map((article) => (
                    <li key={`${pkg.id}:${article.slug}`}>
                      <Link
                        className={location.pathname === `/wiki/${article.slug}` ? 'active' : undefined}
                        to={`/wiki/${article.slug}`}
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </aside>

        <main className="wiki-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

