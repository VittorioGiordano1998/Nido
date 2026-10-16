import { supabase } from '../../core/supabase'

/**
 * Photo helpers shared by item photos and list covers: client-side downscale,
 * upload to the private bucket and signed URLs. State layer (only hooks call
 * Supabase); the views stay Supabase-free.
 */

export const PHOTO_BUCKET = 'list-photos'
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

/** Longest side kept when downscaling before upload. */
const MAX_SIDE = 1600
const JPEG_QUALITY = 0.82
/** Small enough to keep as-is even without re-encoding. */
const KEEP_AS_IS_BYTES = 900 * 1024
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

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

/** `{couple_id}/{uuid}.{ext}`; the first segment is what the storage policies read. */
export function photoPathFor(coupleId: string, file: File): string {
  const rawExt = file.name.includes('.') ? (file.name.split('.').pop() ?? 'jpg') : 'jpg'
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'jpg'
  return `${coupleId}/${crypto.randomUUID()}.${ext}`
}

/**
 * Re-encodes a photo to at most `MAX_SIDE` px on its longest side (JPEG), so
 * backdrops stay light and zooming keeps enough pixels. Already-small JPEGs
 * pass through untouched; failures fall back to the original file.
 */
export async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('Serve un file immagine.')
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('La foto supera 5 MB: scegline una più leggera.')
  }
  if (typeof createImageBitmap !== 'function') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const longest = Math.max(bitmap.width, bitmap.height)
  const scale = Math.min(1, MAX_SIDE / longest)
  if (scale === 1 && (file.type === 'image/jpeg' || file.size <= KEEP_AS_IS_BYTES)) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) return file
  const name = file.name.replace(/\.[^.]+$/, '') || 'foto'
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
}

/** Downscales and uploads; returns the storage path to store on the row. */
export async function uploadListPhoto(coupleId: string, file: File): Promise<string> {
  const prepared = await downscaleImage(file)
  const path = photoPathFor(coupleId, prepared)
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, prepared, { contentType: prepared.type })
  if (error) throw new Error(error.message)
  return path
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

/** Signed URLs for a set of photo paths, keyed by path (long TTL on purpose:
 *  backdrops and covers stay up while the app remains open). */
export async function signPhotoUrls(
  paths: string[],
  ttlSeconds = SIGNED_URL_TTL_SECONDS,
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))]
  if (unique.length === 0) return {}
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(unique, ttlSeconds)
  if (error) throw new Error(error.message)
  const urls: Record<string, string> = {}
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) urls[entry.path] = entry.signedUrl
  }
  return urls
}
