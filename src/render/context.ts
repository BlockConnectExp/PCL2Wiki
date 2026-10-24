export interface RenderContext {
  slug: string;
  assetBase: string;
  resolveAsset: (src: string) => string;
}

export function defaultResolveAsset(src: string, assetBase: string): string {
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  return new URL(src.replace(/^\.\//, ''), assetBase).toString();
}

export function createRenderContext(slug: string, assetBase: string): RenderContext {
  return {
    slug,
    assetBase,
    resolveAsset: (src) => defaultResolveAsset(src, assetBase),
  };
}

