export const SITE = {
  name: 'PCL2 Wiki',
  repo: 'BlockConnectExp/PCL2Wiki',
  domain: 'pcl2.n0th1n3ssd0ma1n.top',
  schemaVersion: 'pcl2wiki-xaml/1',
  giscus: {
    enabled: String(import.meta.env.VITE_GISCUS_ENABLED ?? 'false') === 'true',
    repo: String(import.meta.env.VITE_GISCUS_REPO ?? 'BlockConnectExp/PCL2Wiki'),
    repoId: String(import.meta.env.VITE_GISCUS_REPO_ID ?? ''),
    category: String(import.meta.env.VITE_GISCUS_CATEGORY ?? 'General'),
    categoryId: String(import.meta.env.VITE_GISCUS_CATEGORY_ID ?? ''),
  },
} as const;

