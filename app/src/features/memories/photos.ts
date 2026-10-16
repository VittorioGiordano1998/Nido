import { signPhotoUrls as signBucketPhotoUrls, uploadPhoto } from '../../core/photos'
import { supabase } from '../../core/supabase'

/**
 * Memories photo helpers (TASK-MEMO-…-001): the private `memories` bucket
 * wrapper plus the "remove if unused" cleanup (one photo per memory row, but
 * the check keeps a re-used path safe).
 */

export const MEMORY_BUCKET = 'memories'

/** Downscales and uploads a memory photo; returns the storage path. */
export function uploadMemoryPhoto(coupleId: string, file: File): Promise<string> {
  return uploadPhoto(MEMORY_BUCKET, coupleId, file)
}

/** Removes a memory object when no row references it any more (best effort). */
export async function removeMemoryPhotoIfUnused(path: string): Promise<void> {
  const { data } = await supabase
    .from('memories')
    .select('id')
    .eq('photo_path', path)
    .limit(1)
    .maybeSingle()
  if (data) return
  await supabase.storage.from(MEMORY_BUCKET).remove([path])
}

/** Signed URLs for a set of memory paths, keyed by path. */
export function signMemoryUrls(paths: string[], ttlSeconds?: number): Promise<Record<string, string>> {
  return signBucketPhotoUrls(MEMORY_BUCKET, paths, ttlSeconds)
}
