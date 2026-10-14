import { describe, expect, it } from 'vitest'

import { buildDesignFormData } from './design-form-data'
import {
  detectedColourFields,
  fileProblem,
  fileSize,
  MAX_FILE_MB,
  UPLOAD_DEFAULTS,
} from './upload-schema'

function fakeFile(name: string, bytes: number): File {
  const file = new File(['x'], name)
  Object.defineProperty(file, 'size', { value: bytes })
  return file
}

const MODEL = fakeFile('plank.3mf', 2048)
const PHOTO = fakeFile('plank.png', 2048)

describe('fileProblem', () => {
  it('asks for a model first', () => {
    expect(fileProblem({ model: null, preview: PHOTO, hasListingPhoto: false })).toMatch(/Choose/)
  })

  it('refuses a dropped file that is not a model', () => {
    const pdf = fakeFile('brief.pdf', 10)
    expect(fileProblem({ model: pdf, preview: PHOTO, hasListingPhoto: false })).toMatch(/STL/)
  })

  it('refuses a model over the size limit', () => {
    const big = fakeFile('big.stl', (MAX_FILE_MB + 1) * 1024 * 1024)
    expect(fileProblem({ model: big, preview: PHOTO, hasListingPhoto: false })).toMatch(/limit/)
  })

  it('needs a preview unless a Shopify listing photo stands in', () => {
    expect(fileProblem({ model: MODEL, preview: null, hasListingPhoto: false })).toMatch(/preview/)
    expect(fileProblem({ model: MODEL, preview: null, hasListingPhoto: true })).toBeNull()
  })

  it('passes a model and preview', () => {
    expect(fileProblem({ model: MODEL, preview: PHOTO, hasListingPhoto: false })).toBeNull()
  })
})

describe('fileSize', () => {
  it('reads KB under a megabyte and MB above', () => {
    expect(fileSize(2048)).toBe('2 KB')
    expect(fileSize(3.25 * 1024 * 1024)).toBe('3.3 MB')
  })
})

describe('detectedColourFields', () => {
  it('joins the colours and counts them', () => {
    expect(detectedColourFields(['#000000', '#ffffff'])).toEqual({
      colour: '#000000, #ffffff',
      count: 2,
    })
  })
})

describe('buildDesignFormData', () => {
  it('leaves out empty optional fields and keeps required ones', () => {
    const form = buildDesignFormData({
      values: { ...UPLOAD_DEFAULTS, name: 'Plank' },
      file: MODEL,
      preview: PHOTO,
    })
    expect(form.get('name')).toBe('Plank')
    expect(form.get('notes')).toBeNull()
    expect(form.get('units_per_bed')).toBe('1')
    expect(form.get('preview')).toBeInstanceOf(File)
  })

  it('falls back to the listing photo and carries the snapshot when importing', () => {
    const form = buildDesignFormData({
      values: { ...UPLOAD_DEFAULTS, name: 'Plank' },
      file: MODEL,
      preview: null,
      shopify: {
        product_gid: 'gid://shopify/Product/1',
        handle: 'plank',
        admin_url: 'https://admin.example/products/1',
        image_url: 'https://cdn.example/plank.png',
        min_price: '499',
        max_price: '599',
        currency: 'INR',
      },
    })
    expect(form.get('preview_url')).toBe('https://cdn.example/plank.png')
    expect(form.get('shopify_handle')).toBe('plank')
  })
})
