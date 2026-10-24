import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="empty-state">
      <h1>未找到页面</h1>
      <p>该地址没有对应文稿。</p>
      <Link className="button" to="/">
        返回首页
      </Link>
    </section>
  );
}

