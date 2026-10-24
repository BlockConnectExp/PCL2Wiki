import { z } from 'zod';
import type { PackageManifest } from './types';

export const articleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  source: z.string().min(1),
  tags: z.array(z.string()).optional(),
  updated: z.string().optional(),
  summary: z.string().optional(),
});

export const assetSchema = z.object({
  path: z.string().min(1),
  sha256: z.string().min(1),
  bytes: z.number().nonnegative(),
  mime: z.string().min(1),
});

export const manifestSchema = z.object({
  spec: z.literal('pcl2wiki-package/1'),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  title: z.string().min(1),
  version: z.string().min(1),
  language: z.string().min(2),
  entry: z.string().optional(),
  articles: z.array(articleSchema),
  assets: z.array(assetSchema).optional(),
  generator: z.string().optional(),
  createdAt: z.string().optional(),
  description: z.string().optional(),
});

export function validateManifest(value: unknown): PackageManifest {
  return manifestSchema.parse(value) as PackageManifest;
}

export function safeParseManifest(
  value: unknown,
): { ok: true; manifest: PackageManifest } | { ok: false; message: string } {
  const result = manifestSchema.safeParse(value);
  if (result.success) return { ok: true, manifest: result.data as PackageManifest };
  return {
    ok: false,
    message: result.error.issues
      .map((issue) => `${issue.path.join('.') || 'manifest'}: ${issue.message}`)
      .join('; '),
  };
}

