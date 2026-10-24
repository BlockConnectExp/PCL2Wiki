import { Link } from 'react-router-dom';
import { useContentIndex } from './ContentIndexProvider';

export function HomePage() {
  const { index, loading } = useContentIndex();

  if (loading) return <p className="page-note">加载中…</p>;

  if (index.articles.length === 0) {
    return (
      <section className="empty-state">
        <h1>尚无文稿</h1>
        <p>内容包就绪后，文章会出现在这里。</p>
        <Link className="button primary" to="/editor">
          打开编辑器
        </Link>
      </section>
    );
  }

  return (
    <div className="home">
      <header className="home-header">
        <h1>PCL2 Wiki</h1>
        <p>{index.articles.length} 篇文稿</p>
      </header>
      {index.packages.map((pkg) => {
        const articles = index.articles.filter((article) => article.packageId === pkg.id);
        if (articles.length === 0) return null;
        return (
          <section key={pkg.id} className="home-package">
            <h2>{pkg.title}</h2>
            <ul className="article-list">
              {articles.map((article) => (
                <li key={`${pkg.id}:${article.slug}`}>
                  <Link to={`/wiki/${article.slug}`}>{article.title}</Link>
                  {article.summary && <p>{article.summary}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

