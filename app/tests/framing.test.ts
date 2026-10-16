import { describe, expect, it } from 'vitest'

import { DEFAULT_FRAMING, clampFraming } from '../src/features/lists/photos'

describe('clampFraming', () => {
  it('keeps the frame inside the photo and the zoom in range', () => {
    expect(clampFraming({ x: 140, y: -20, zoom: 9 })).toEqual({ x: 100, y: 0, zoom: 3 })
    expect(clampFraming({ x: -5, y: 130, zoom: 0.4 })).toEqual({ x: 0, y: 100, zoom: 1 })
  })

  it('leaves valid values untouched and defaults to the centre', () => {
    expect(clampFraming({ x: 30, y: 70, zoom: 1.5 })).toEqual({ x: 30, y: 70, zoom: 1.5 })
    expect(DEFAULT_FRAMING).toEqual({ x: 50, y: 50, zoom: 1 })
  })
})
