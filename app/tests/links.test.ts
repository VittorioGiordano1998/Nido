import { describe, expect, it } from 'vitest'

import { parseLinkInput, safeHttpUrl } from '../src/core/links'

describe('safeHttpUrl', () => {
  it('accepts http and https', () => {
    expect(safeHttpUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
    expect(safeHttpUrl('http://example.com')).toBe('http://example.com/')
  })

  it('rejects script and data schemes, even disguised', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('javascript://%0Aalert(1)')).toBeNull()
    expect(safeHttpUrl('  JaVaScRiPt:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeHttpUrl('ftp://example.com')).toBeNull()
  })

  it('rejects empty and malformed values', () => {
    expect(safeHttpUrl('')).toBeNull()
    expect(safeHttpUrl(null)).toBeNull()
    expect(safeHttpUrl('not a url')).toBeNull()
  })
})

describe('parseLinkInput', () => {
  it('adds https to a bare host', () => {
    expect(parseLinkInput('example.com/x')).toBe('https://example.com/x')
  })

  it('keeps an explicit web scheme and refuses any other', () => {
    expect(parseLinkInput('http://example.com')).toBe('http://example.com/')
    expect(parseLinkInput('javascript://%0Aalert(1)')).toBeNull()
    expect(parseLinkInput('javascript:alert(1)')).toBeNull()
  })
})
