import { beforeEach, describe, expect, it, vi } from 'vitest'

const createSignedUrls = vi.fn()

vi.mock('../src/core/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({ createSignedUrls }),
    },
  },
}))

const { cachedSignedUrls, signPhotoUrls } = await import('../src/core/photos')

describe('signPhotoUrls cache', () => {
  beforeEach(() => {
    createSignedUrls.mockReset()
    createSignedUrls.mockImplementation(async (paths: string[]) => ({
      data: paths.map((path) => ({ path, signedUrl: `https://signed.example/${path}?t=1` })),
      error: null,
    }))
  })

  it('reuses a signed URL instead of signing it again', async () => {
    const first = await signPhotoUrls('list-photos', ['couple/a.jpg'])
    const second = await signPhotoUrls('list-photos', ['couple/a.jpg'])

    expect(second).toEqual(first)
    expect(createSignedUrls).toHaveBeenCalledTimes(1)
  })

  it('signs only the paths that are not cached yet', async () => {
    await signPhotoUrls('list-photos', ['couple/missing-a.jpg'])
    const result = await signPhotoUrls('list-photos', ['couple/missing-a.jpg', 'couple/missing-b.jpg'])

    expect(Object.keys(result).sort()).toEqual(['couple/missing-a.jpg', 'couple/missing-b.jpg'])
    expect(createSignedUrls).toHaveBeenLastCalledWith(['couple/missing-b.jpg'], expect.any(Number))
  })

  it('keeps buckets apart', async () => {
    await signPhotoUrls('list-photos', ['couple/shared.jpg'])
    await signPhotoUrls('avatars', ['couple/shared.jpg'])

    expect(createSignedUrls).toHaveBeenCalledTimes(2)
  })

  it('reads known URLs synchronously, without touching storage', async () => {
    await signPhotoUrls('list-photos', ['couple/sync.jpg'])
    createSignedUrls.mockClear()

    const known = cachedSignedUrls('list-photos', ['couple/sync.jpg', 'couple/unknown.jpg'])

    expect(known).toEqual({ 'couple/sync.jpg': 'https://signed.example/couple/sync.jpg?t=1' })
    expect(createSignedUrls).not.toHaveBeenCalled()
  })

  it('does not call storage when there is nothing to sign', async () => {
    expect(await signPhotoUrls('list-photos', [])).toEqual({})
    expect(createSignedUrls).not.toHaveBeenCalled()
  })
})
