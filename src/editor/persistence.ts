import { del, get, set } from 'idb-keyval';
import type { WorkspaceSnapshot } from './store';

const STORAGE_KEY = 'pcl2wiki-workspace-v1';

export async function loadWorkspace(): Promise<WorkspaceSnapshot | null> {
  try {
    return ((await get(STORAGE_KEY)) as WorkspaceSnapshot | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function saveWorkspace(snapshot: WorkspaceSnapshot): Promise<void> {
  try {
    await set(STORAGE_KEY, snapshot);
  } catch {
    // Browsers can reject IndexedDB writes in private mode; the workspace stays in memory.
  }
}

export async function clearWorkspace(): Promise<void> {
  try {
    await del(STORAGE_KEY);
  } catch {
    // Ignore cleanup failures.
  }
}

