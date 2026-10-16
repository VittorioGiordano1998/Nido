import { LIST_PHOTO_BUCKET, signPhotoUrls as signBucketPhotoUrls, uploadPhoto } from '../../core/photos'
import { supabase } from '../../core/supabase'

/**
 * Lists photo helpers: the `list-photos` bucket wrapper plus the backdrop
 * framing model and the "remove if unused" cleanup that knows which tables
 * reference a photo (item attachment, list cover).
 */

export const PHOTO_BUCKET = LIST_PHOTO_BUCKET

/** Backdrop framing: where the photo sits (percent) and how zoomed it is. */
export interface Framing {
  x: number
  y: number
  zoom: number
}

export const DEFAULT_FRAMING: Framing = { x: 50, y: 50, zoom: 1 }

export function clampFraming(framing: Framing): Framing {
  return {
    x: Math.min(100, Math.max(0, framing.x)),
    y: Math.min(100, Math.max(0, framing.y)),
    zoom: Math.min(3, Math.max(1, framing.zoom)),
  }
}

/** Downscales and uploads an item photo or list cover; returns the path. */
export function uploadListPhoto(coupleId: string, file: File): Promise<string> {
  return uploadPhoto(PHOTO_BUCKET, coupleId, file)
}

/** Removes an object when nothing references it any more (best effort). */
export async function removePhotoIfUnused(path: string): Promise<void> {
  const [attachment, cover] = await Promise.all([
    supabase.from('task_attachments').select('id').eq('value', path).limit(1).maybeSingle(),
    supabase.from('task_lists').select('id').eq('cover_path', path).limit(1).maybeSingle(),
  ])
  if (attachment.data || cover.data) return
  await supabase.storage.from(PHOTO_BUCKET).remove([path])
}

/** Signed URLs for a set of list-photo paths, keyed by path. */
export function signPhotoUrls(paths: string[], ttlSeconds?: number): Promise<Record<string, string>> {
  return signBucketPhotoUrls(PHOTO_BUCKET, paths, ttlSeconds)
}
